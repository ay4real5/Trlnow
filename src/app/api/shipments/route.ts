import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTrackingNumber } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    senderId,
    senderName,
    senderPhone,
    senderAddress,
    recipientName,
    recipientPhone,
    recipientAddress,
    originBranchId,
    destBranchId,
    weight,
    estimatedDelivery,
  } = body;

  if (!senderName || !recipientName || !originBranchId || !destBranchId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let trackingNumber = generateTrackingNumber();
  let exists = await prisma.shipment.findUnique({ where: { trackingNumber } });
  while (exists) {
    trackingNumber = generateTrackingNumber();
    exists = await prisma.shipment.findUnique({ where: { trackingNumber } });
  }

  const shipment = await prisma.shipment.create({
    data: {
      trackingNumber,
      senderId: senderId || null,
      senderName,
      senderPhone: senderPhone || null,
      senderAddress: senderAddress || null,
      recipientName,
      recipientPhone: recipientPhone || null,
      recipientAddress: recipientAddress || null,
      originBranchId,
      destBranchId,
      weight: weight ? parseFloat(weight) : null,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      statusHistory: {
        create: {
          status: "created",
          description: "Shipment booked",
          updatedByUserId: session.user.id,
        },
      },
    },
  });

  return NextResponse.json(shipment);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId");

  const shipments = await prisma.shipment.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(branchId ? { OR: [{ originBranchId: branchId }, { destBranchId: branchId }] } : {}),
    },
    include: {
      originBranch: true,
      destBranch: true,
      sender: true,
      statusHistory: { orderBy: { timestamp: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shipments);
}
