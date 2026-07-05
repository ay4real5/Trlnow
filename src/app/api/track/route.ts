import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeTrackingNumber } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawTrackingNumber = searchParams.get("trackingNumber");

  if (!rawTrackingNumber) {
    return NextResponse.json({ error: "Tracking number required" }, { status: 400 });
  }

  const trackingNumber = normalizeTrackingNumber(rawTrackingNumber);
  if (!trackingNumber.startsWith("TRL")) {
    return NextResponse.json({ error: "Invalid tracking number" }, { status: 400 });
  }

  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
    include: {
      originBranch: true,
      destBranch: true,
      statusHistory: {
        include: { branch: true },
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  return NextResponse.json(shipment);
}
