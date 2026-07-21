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

  // Editing a past entry corrects history — it does not change the
  // shipment's current headline status. Use "Update Status" (or the Journey
  // Builder) to change what the shipment's status actually is right now.
  const updated = await prisma.shipmentStatus.update({
    where: { id: params.historyId },
    data,
  });

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

  // Removing a past entry corrects history — it does not change the
  // shipment's current headline status.
  await prisma.shipmentStatus.delete({ where: { id: params.historyId } });

  return NextResponse.json({ success: true });
}
