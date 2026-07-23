import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertAccess(patientId: string, userId: string, role: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return { patient: null, allowed: false };
  const allowed = role === "ADMIN" || patient.createdById === userId || patient.userId === userId;
  return { patient, allowed };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = await assertAccess(params.id, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      screenings: {
        orderBy: { screeningDate: "desc" },
        include: { images: true, analysis: true, sentToDoctor: { select: { name: true, email: true } } },
      },
    },
  });

  return NextResponse.json(patient);
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  age: z.number().int().min(0).max(130).optional(),
  gender: z.string().min(1).optional(),
  diabetesDuration: z.number().int().min(0).optional(),
  contactNumber: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = await assertAccess(params.id, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.patient.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = await assertAccess(params.id, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.patient.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
