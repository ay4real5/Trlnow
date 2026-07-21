import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shipmentOrigin, shipmentDest } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const shipments = await prisma.shipment.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(branchId ? { OR: [{ originBranchId: branchId }, { destBranchId: branchId }] } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { originBranch: true, destBranch: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: string[][] = [
    ["Tracking Number", "Sender", "Recipient", "Origin", "Destination", "Status", "Weight", "Created At", "Estimated Delivery"],
    ...shipments.map((s): string[] => [
      s.trackingNumber,
      s.senderName,
      s.recipientName,
      shipmentOrigin(s),
      shipmentDest(s),
      s.status,
      s.weight?.toString() || "",
      s.createdAt.toISOString(),
      s.estimatedDelivery?.toISOString() || "",
    ]),
  ];

  const csv = rows
    .map((r: string[]) => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=shipments-report.csv",
    },
  });
}
