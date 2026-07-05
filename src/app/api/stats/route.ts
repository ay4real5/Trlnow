import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [total, inTransit, delivered, delayed, branches, customers, recentShipments] =
    await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: "in_transit" } }),
      prisma.shipment.count({ where: { status: "delivered" } }),
      prisma.shipment.count({ where: { status: "exception" } }),
      prisma.branch.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.shipment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { originBranch: true, destBranch: true },
      }),
    ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyStats = await prisma.shipment.groupBy({
    by: ["status"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  });

  return NextResponse.json({
    total,
    inTransit,
    delivered,
    delayed,
    branches,
    customers,
    recentShipments,
    dailyStats,
  });
}
