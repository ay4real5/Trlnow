import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      sentShipments: {
        include: { originBranch: true, destBranch: true },
        orderBy: { createdAt: "desc" },
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { shipment: { select: { trackingNumber: true } } },
      },
    },
  });

  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { passwordHash, ...safe } = customer;
  return NextResponse.json(safe);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.user.findUnique({ where: { id: params.id } });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, any> = {};

  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.phone === "string") data.phone = body.phone.trim() || null;
  if (typeof body.adminNotes === "string") data.adminNotes = body.adminNotes.trim() || null;

  if (typeof body.email === "string" && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    if (email !== customer.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      data.email = email;
    }
  }

  if (body.status === "active" || body.status === "suspended") {
    data.status = body.status;
  }

  if (typeof body.newPassword === "string" && body.newPassword) {
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: params.id }, data });
  const { passwordHash, ...safe } = updated;
  return NextResponse.json(safe);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.user.findUnique({ where: { id: params.id } });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
