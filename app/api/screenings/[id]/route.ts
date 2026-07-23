import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadScreeningWithAccess(id: string, userId: string, role: string) {
  const screening = await prisma.screeningRecord.findUnique({
    where: { id },
    include: {
      images: true,
      analysis: true,
      patient: true,
      sentToDoctor: { select: { id: true, name: true, email: true } },
    },
  });

  if (!screening) return { screening: null, allowed: false };

  const allowed =
    role === "ADMIN" ||
    screening.patient.createdById === userId ||
    screening.patient.userId === userId ||
    screening.sentToDoctorId === userId;

  return { screening, allowed };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { screening, allowed } = await loadScreeningWithAccess(params.id, session.user.id, session.user.role);
  if (!screening) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(screening);
}

const sendSchema = z.object({ doctorId: z.string() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["NGO", "DOCTOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { screening, allowed } = await loadScreeningWithAccess(params.id, session.user.id, session.user.role);
  if (!screening) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
  }

  const doctor = await prisma.user.findUnique({ where: { id: parsed.data.doctorId } });
  if (!doctor || doctor.role !== "DOCTOR") {
    return NextResponse.json({ error: "Selected user is not a doctor" }, { status: 400 });
  }

  const updated = await prisma.screeningRecord.update({
    where: { id: params.id },
    data: { sentToDoctorId: doctor.id, sentAt: new Date() },
  });

  return NextResponse.json(updated);
}
