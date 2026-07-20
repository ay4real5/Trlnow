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
    originCity,
    originCountry,
    destCity,
    destCountry,
    originBranchId,
    destBranchId,
    weight,
    estimatedDelivery,
  } = body;

  // A shipment can move between any two places in the world: city is
  // required on each side, a branch link is optional either way.
  if (!senderName || !recipientName || !String(originCity || "").trim() || !String(destCity || "").trim()) {
    return NextResponse.json(
      { error: "Sender name, recipient name, and an origin/destination city are required" },
      { status: 400 }
    );
  }

  if (originBranchId) {
    const b = await prisma.branch.findUnique({ where: { id: originBranchId } });
    if (!b) return NextResponse.json({ error: "Origin branch not found" }, { status: 400 });
  }
  if (destBranchId) {
    const b = await prisma.branch.findUnique({ where: { id: destBranchId } });
    if (!b) return NextResponse.json({ error: "Destination branch not found" }, { status: 400 });
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
      originCity: String(originCity).trim(),
      originCountry: originCountry ? String(originCountry).trim() : null,
      destCity: String(destCity).trim(),
      destCountry: destCountry ? String(destCountry).trim() : null,
      originBranchId: originBranchId || null,
      destBranchId: destBranchId || null,
      weight: weight ? parseFloat(weight) : null,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      statusHistory: {
        create: {
          status: "created",
          description: "Shipment booked",
          branchId: originBranchId || null,
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
