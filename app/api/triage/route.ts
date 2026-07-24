import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaxHeap } from "@/lib/priority-queue";

interface TriageItem {
  screeningId: string;
  patientId: string;
  patientName: string;
  drStage: string | null;
  grade: number;
  confidenceScore: number | null;
  screeningDate: Date;
  imagePath: string | null;
}

const GRADE_BY_STAGE: Record<string, number> = {
  NO_DR: 0,
  MILD: 1,
  MODERATE: 2,
  SEVERE: 3,
  PROLIFERATIVE: 4,
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DOCTOR", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // A doctor's triage list = screenings for patients they manage themselves,
  // plus any screenings an NGO/org has explicitly routed to them.
  const screenings = await prisma.screeningRecord.findMany({
    where: {
      drStage: { not: null },
      OR: [
        { patient: { createdById: session.user.id } },
        { sentToDoctorId: session.user.id },
        ...(session.user.role === "ADMIN" ? [{}] : []),
      ],
    },
    include: { patient: true, images: { take: 1 } },
    orderBy: { screeningDate: "desc" },
    take: 200, // cap so the heap build stays fast even on a busy install
  });

  // Build a max-heap keyed on severity (primary) + confidence (secondary,
  // as a tiebreaker) — O(log n) per insert, O(n log n) to fully drain, per
  // the brief's triage requirement.
  const heap = new MaxHeap<TriageItem>((item) => item.grade * 10 + (item.confidenceScore ?? 0));

  for (const s of screenings) {
    heap.insert({
      screeningId: s.id,
      patientId: s.patientId,
      patientName: s.patient.name,
      drStage: s.drStage,
      grade: s.drStage ? GRADE_BY_STAGE[s.drStage] ?? 0 : 0,
      confidenceScore: s.confidenceScore,
      screeningDate: s.screeningDate,
      imagePath: s.images[0]?.imagePath ?? null,
    });
  }

  return NextResponse.json(heap.toSortedArray());
}
