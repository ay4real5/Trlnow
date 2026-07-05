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
  const { status, location, description, branchId } = body;

  if (status) {
    const shipment = await prisma.shipment.update({
      where: { id: params.id },
      data: { status },
      include: { sender: true },
    });

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

  const updated = await prisma.shipment.update({
    where: { id: params.id },
    data: body,
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
