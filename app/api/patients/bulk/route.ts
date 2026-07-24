import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const rowSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(0).max(130),
  gender: z.string().min(1),
  diabetesDuration: z.number().int().min(0).optional(),
  contactNumber: z.string().optional(),
});

const bodySchema = z.object({
  patients: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["NGO", "DOCTOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A list of patients is required" }, { status: 400 });
  }

  let created = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < parsed.data.patients.length; i++) {
    const row = rowSchema.safeParse(parsed.data.patients[i]);
    if (!row.success) {
      errors.push({ row: i + 1, message: row.error.issues[0]?.message ?? "Invalid row" });
      continue;
    }
    try {
      await prisma.patient.create({ data: { ...row.data, createdById: session.user.id } });
      created++;
    } catch {
      errors.push({ row: i + 1, message: "Couldn't save this row" });
    }
  }

  return NextResponse.json({ created, errors });
}
