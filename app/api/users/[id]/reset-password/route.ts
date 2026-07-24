import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateTempPassword() {
  // Short, readable, URL-safe temporary password (e.g. "aK9pQ2xR7m")
  return crypto.randomBytes(8).toString("base64").replace(/[+/=]/g, "").slice(0, 10);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Returned once, shown only to the admin — not stored anywhere in plaintext.
  return NextResponse.json({ tempPassword });
}
