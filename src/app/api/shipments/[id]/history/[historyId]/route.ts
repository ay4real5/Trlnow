import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  return NextResponse.json({ success: true });
}
