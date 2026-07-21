import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, shipmentStatusEmail } from "@/lib/notifications";

// Quick single-step updates (status change, comment) should always land
// after everything already on the timeline — never "now" blindly, since a
// Journey Builder plan can legitimately have future-dated stops recorded
// ahead of time. Without this, a real-time update can render ABOVE an
// already-recorded later stop, reading as if events happened out of order.
async function nextTimestamp(shipmentId: string): Promise<Date> {
  const latest = await prisma.shipmentStatus.findFirst({
    where: { shipmentId },
    orderBy: { timestamp: "desc" },
  });
  const now = new Date();
  if (!latest || latest.timestamp.getTime() < now.getTime()) return now;
  return new Date(latest.timestamp.getTime() + 60_000);
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id: params.id },
    include: {
      originBranch: true,
      destBranch: true,
      sender: { select: { id: true, name: true, email: true, phone: true } },
      statusHistory: {
        include: {
          branch: true,
          updatedBy: { select: { id: true, name: true } },
        },
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(shipment);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, location, description, branchId, comment } = body;

  // Comment-only update: add a timeline entry without changing the status
  if (!status && typeof comment === "string" && comment.trim()) {
    const shipment = await prisma.shipment.findUnique({ where: { id: params.id } });
    if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const entry = await prisma.shipmentStatus.create({
      data: {
        shipmentId: params.id,
        status: shipment.status,
        location: location || null,
        description: comment.trim(),
        branchId: branchId || null,
        updatedByUserId: session.user.id,
        timestamp: await nextTimestamp(params.id),
      },
    });
    return NextResponse.json(entry);
  }

  if (status) {
    // The shipment's headline status is a direct command: whatever the admin
    // explicitly picks here becomes current status immediately. It is NOT
    // derived from timeline timestamps — a courier's own record of "where
    // this shipment is" should never be silently overridden by an unrelated
    // entry's date (e.g. a Journey Builder plan dated ahead of "now"). The
    // new entry is still recorded with its own real timestamp for history.
    const shipment = await prisma.shipment.update({
      where: { id: params.id },
      data: { status },
      include: { sender: { select: { id: true, name: true, email: true, phone: true } } },
    });

    await prisma.shipmentStatus.create({
      data: {
        shipmentId: params.id,
        status,
        location: location || null,
        description: description || null,
        branchId: branchId || null,
        updatedByUserId: session.user.id,
        timestamp: await nextTimestamp(params.id),
      },
    });

    if (shipment.sender?.email) {
      const emailContent = shipmentStatusEmail(
        shipment.trackingNumber,
        status,
        description,
        location
      );
      try {
        await sendEmail(shipment.sender.email, emailContent.subject, emailContent.html);
        await prisma.notification.create({
          data: {
            shipmentId: shipment.id,
            userId: shipment.senderId,
            message: emailContent.subject,
            channel: "EMAIL",
            status: "sent",
            sentAt: new Date(),
          },
        });
      } catch {
        await prisma.notification.create({
          data: {
            shipmentId: shipment.id,
            userId: shipment.senderId,
            message: emailContent.subject,
            channel: "EMAIL",
            status: "failed",
          },
        });
      }
    }

    return NextResponse.json(shipment);
  }

  // Details edit: only allow known editable fields through
  const data: Record<string, any> = {};
  const stringFields = [
    "senderName", "senderPhone", "senderAddress",
    "recipientName", "recipientPhone", "recipientAddress",
    "originCity", "originCountry", "destCity", "destCountry",
  ];
  for (const field of stringFields) {
    if (typeof body[field] === "string") data[field] = body[field].trim() || null;
  }
  // Names and city are the only required text fields — never blank them out
  for (const required of ["senderName", "recipientName", "originCity", "destCity"]) {
    if (required in data && !data[required]) delete data[required];
  }
  // Branch links are optional either way — "" clears the link, a real id sets it
  if (typeof body.originBranchId === "string") {
    data.originBranchId = body.originBranchId.trim() || null;
  }
  if (typeof body.destBranchId === "string") {
    data.destBranchId = body.destBranchId.trim() || null;
  }
  if (body.weight !== undefined) {
    const w = Number(body.weight);
    data.weight = Number.isFinite(w) && w > 0 ? w : null;
  }
  if (body.estimatedDelivery !== undefined) {
    const d = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null;
    data.estimatedDelivery = d && !Number.isNaN(d.getTime()) ? d : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  for (const [field, branchId] of [["originBranchId", data.originBranchId], ["destBranchId", data.destBranchId]] as const) {
    if (field in data && branchId) {
      const b = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!b) return NextResponse.json({ error: `${field === "originBranchId" ? "Origin" : "Destination"} branch not found` }, { status: 400 });
    }
  }

  const updated = await prisma.shipment.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.shipment.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
