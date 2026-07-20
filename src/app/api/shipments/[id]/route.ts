import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, shipmentStatusEmail } from "@/lib/notifications";

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
      sender: true,
      statusHistory: {
        include: { branch: true, updatedBy: true },
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
      },
    });
    return NextResponse.json(entry);
  }

  if (status) {
    const existing = await prisma.shipment.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.shipmentStatus.create({
      data: {
        shipmentId: params.id,
        status,
        location: location || null,
        description: description || null,
        branchId: branchId || null,
        updatedByUserId: session.user.id,
      },
    });

    // The shipment's headline status always mirrors whichever timeline entry
    // is chronologically latest — not necessarily the one just added, since
    // a manual update can land earlier than an already-recorded future stop
    // (e.g. a Journey Builder plan dated ahead of "now"). Same convention as
    // the journey-apply and timeline-entry edit/delete endpoints.
    const latest = await prisma.shipmentStatus.findFirst({
      where: { shipmentId: params.id },
      orderBy: { timestamp: "desc" },
    });
    const shipment = await prisma.shipment.update({
      where: { id: params.id },
      data: { status: latest?.status ?? status },
      include: { sender: true },
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
