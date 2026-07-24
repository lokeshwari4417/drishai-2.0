import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const roleName = url.searchParams.get("role") || "";

  // Dynamic search constraints
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (roleName) {
    where.role = {
      name: roleName,
    };
  }

  try {
    const dbUsers = await prisma.user.findMany({
      where,
      include: {
        role: true,
        _count: { select: { createdPatients: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map relational structure back to string structure for simple compatibility
    const users = dbUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.name,
      isBlocked: u.isBlocked,
      createdAt: u.createdAt,
      _count: u._count,
    }));

    return NextResponse.json(users);
  } catch (err) {
    console.error("GET users error:", err);
    return NextResponse.json({ error: "Could not load users" }, { status: 500 });
  }
}
