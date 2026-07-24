import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase() : "";

  if (!email) return NextResponse.json({ exists: false });

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return NextResponse.json({ exists: !!user });
}
