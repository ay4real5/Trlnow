import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SHIPMENT_STATUSES } from "@/lib/utils";

// Bulk-apply a journey: create a sequence of timeline entries in one shot,
// optionally replacing the existing timeline. Admin only.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shipment = await prisma.shipment.findUnique({ where: { id: params.id } });
  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { steps, replaceExisting, estimatedDelivery } = body;

  if (!Array.isArray(steps) || steps.length === 0 || steps.length > 30) {
    return NextResponse.json({ error: "Provide 1-30 journey steps" }, { status: 400 });
  }

  const validStatuses = new Set<string>(SHIPMENT_STATUSES);
  const parsed: any[] = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (!s || !validStatuses.has(s.status)) {
      return NextResponse.json({ error: `Step ${i + 1}: invalid status` }, { status: 400 });
    }
    const ts = s.timestamp ? new Date(s.timestamp) : new Date();
    if (Number.isNaN(ts.getTime())) {
      return NextResponse.json({ error: `Step ${i + 1}: invalid timestamp` }, { status: 400 });
    }
    parsed.push({
      shipmentId: params.id,
      status: String(s.status),
      location: s.location ? String(s.location) : null,
      description: s.description ? String(s.description) : null,
      branchId: s.branchId ? String(s.branchId) : null,
      updatedByUserId: session.user.id,
      timestamp: ts,
    });
  }

  const lastStep = parsed[parsed.length - 1];
  const shipmentData: Record<string, any> = { status: lastStep.status };
  if (estimatedDelivery !== undefined) {
    const d = estimatedDelivery ? new Date(estimatedDelivery) : null;
    shipmentData.estimatedDelivery = d && !Number.isNaN(d.getTime()) ? d : null;
  }

  await prisma.$transaction([
    ...(replaceExisting
      ? [prisma.shipmentStatus.deleteMany({ where: { shipmentId: params.id } })]
      : []),
    prisma.shipmentStatus.createMany({ data: parsed }),
    prisma.shipment.update({ where: { id: params.id }, data: shipmentData }),
  ]);

  const updated = await prisma.shipment.findUnique({
    where: { id: params.id },
    include: {
      statusHistory: { orderBy: { timestamp: "asc" } },
    },
  });
  return NextResponse.json(updated);
}
