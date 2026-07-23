import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createPatientSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().min(0).max(130),
  gender: z.string().min(1),
  diabetesDuration: z.number().int().min(0).optional(),
  contactNumber: z.string().optional(),
});

// GET /api/patients?search=... — Doctor/NGO/Admin see patients they created
// (Admin sees all). Patient role isn't expected to call this (they only
// ever see their own linked profile).
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DOCTOR", "NGO", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();

  const patients = await prisma.patient.findMany({
    where: {
      ...(session.user.role === "ADMIN" ? {} : { createdById: session.user.id }),
      ...(search
        ? { name: { contains: search } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      screenings: {
        orderBy: { screeningDate: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(patients);
}

// POST /api/patients — Doctor/NGO/Admin create a new patient record.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DOCTOR", "NGO", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const patient = await prisma.patient.create({
    data: { ...parsed.data, createdById: session.user.id },
  });

  return NextResponse.json(patient, { status: 201 });
}
