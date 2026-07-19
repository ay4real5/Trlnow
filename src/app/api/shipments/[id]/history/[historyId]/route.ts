import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SHIPMENT_STATUSES } from "@/lib/utils";

// Edit a timeline entry: status, location, description, timestamp. Admin only.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; historyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = await prisma.shipmentStatus.findUnique({
    where: { id: params.historyId },
  });
  if (!entry || entry.shipmentId !== params.id) {
    return NextResponse.json({ error: "Timeline entry not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, any> = {};

  if (body.status !== undefined) {
    if (!(SHIPMENT_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.location !== undefined) data.location = body.location ? String(body.location) : null;
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body.timestamp !== undefined) {
    const ts = new Date(body.timestamp);
    if (Number.isNaN(ts.getTime())) {
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
    }
    data.timestamp = ts;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.shipmentStatus.update({
    where: { id: params.historyId },
    data,
  });

  // Keep the shipment's headline status in sync with the latest timeline entry
  const latest = await prisma.shipmentStatus.findFirst({
    where: { shipmentId: params.id },
    orderBy: { timestamp: "desc" },
  });
  if (latest) {
    await prisma.shipment.update({
      where: { id: params.id },
      data: { status: latest.status },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; historyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = await prisma.shipmentStatus.findUnique({
    where: { id: params.historyId },
  });
  if (!entry || entry.shipmentId !== params.id) {
    return NextResponse.json({ error: "Timeline entry not found" }, { status: 404 });
  }

  await prisma.shipmentStatus.delete({ where: { id: params.historyId } });

  const latest = await prisma.shipmentStatus.findFirst({
    where: { shipmentId: params.id },
    orderBy: { timestamp: "desc" },
  });
  if (latest) {
    await prisma.shipment.update({
      where: { id: params.id },
      data: { status: latest.status },
    });
  }

  return NextResponse.json({ success: true });
}
