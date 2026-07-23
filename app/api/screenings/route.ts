import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stageByGrade } from "@/lib/dr-stages";

const createScreeningSchema = z.object({
  patientId: z.string(),
  eyeSide: z.enum(["LEFT", "RIGHT"]),
  imageDataUrl: z.string().min(1), // base64 preview from client-side preprocessing
  grade: z.number().int().min(0).max(4),
  confidence: z.number().min(0).max(1),
  modelVersion: z.string(),
});

async function assertAccess(patientId: string, userId: string, role: string) {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) return false;
  return role === "ADMIN" || patient.createdById === userId || patient.userId === userId;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createScreeningSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { patientId, eyeSide, imageDataUrl, grade, confidence, modelVersion } = parsed.data;

  const allowed = await assertAccess(patientId, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const stage = stageByGrade(grade);

  const screening = await prisma.screeningRecord.create({
    data: {
      patientId,
      drStage: stage.key,
      confidenceScore: confidence,
      recommendation: stage.recommendation,
      images: {
        create: [{ imagePath: imageDataUrl, eyeSide }],
      },
      analysis: {
        create: { modelVersion },
      },
    },
    include: { images: true, analysis: true },
  });

  return NextResponse.json(screening, { status: 201 });
}
