import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stageByKey } from "@/lib/dr-stages";
import SeverityBadge from "@/components/severity-badge";
import ReportReadAloud from "@/components/report-read-aloud";
import SendToDoctorForm from "@/components/send-to-doctor-form";
import ScanRing from "@/components/scan-ring";

export default async function ReportDetail({ screeningId }: { screeningId: string }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const screening = await prisma.screeningRecord.findUnique({
    where: { id: screeningId },
    include: {
      images: true,
      analysis: true,
      patient: true,
      sentToDoctor: { select: { name: true, email: true } },
    },
  });

  if (!screening) notFound();

  const allowed =
    session.user.role === "ADMIN" ||
    screening.patient.createdById === session.user.id ||
    screening.patient.userId === session.user.id ||
    screening.sentToDoctor?.email === session.user.email;

  if (!allowed) redirect("/login");

  const stage = screening.drStage ? stageByKey(screening.drStage) : null;
  const confidencePct = screening.confidenceScore ? Math.round(screening.confidenceScore * 100) : null;

  const readText = stage
    ? `Screening for ${screening.patient.name}, taken on ${new Date(screening.screeningDate).toLocaleDateString()}. Result: ${stage.label}, with ${confidencePct} percent confidence. Recommendation: ${stage.recommendation}`
    : "This screening has no result yet.";

  return (
    <div>
      <div className="flex animate-fade-up items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-neutral-900">Screening report</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {screening.patient.name} · {new Date(screening.screeningDate).toLocaleString()}
          </p>
        </div>
        <ReportReadAloud text={readText} />
      </div>

      <div className="mt-6 grid animate-fade-up gap-6 sm:grid-cols-[280px_1fr]" style={{ animationDelay: "80ms" }}>
        <div>
          {screening.images.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.imagePath}
              alt={`${img.eyeSide} eye fundus scan`}
              className="mb-2 w-full rounded-xl border border-neutral-200 object-cover"
            />
          ))}
          {screening.images[0] && (
            <p className="text-center text-xs text-neutral-500">{screening.images[0].eyeSide} eye</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-4">
              {stage && confidencePct !== null && (
                <ScanRing mode="result" value={screening.confidenceScore ?? 0} color={stage.colorHex} size={72} label="confidence" />
              )}
              <SeverityBadge stageKey={screening.drStage} />
            </div>
            <p className="mt-3 text-sm text-neutral-700">{screening.recommendation}</p>
            {screening.analysis && (
              <p className="mt-3 font-mono text-xs text-neutral-400">
                Model: {screening.analysis.modelVersion} · Analyzed {new Date(screening.analysis.analyzedAt).toLocaleString()}
              </p>
            )}
          </div>

          {screening.sentToDoctor ? (
            <div className="card bg-brand-50">
              <p className="text-sm text-brand-800">
                Sent to Dr. {screening.sentToDoctor.name} ({screening.sentToDoctor.email})
              </p>
            </div>
          ) : (
            (session.user.role === "NGO" || session.user.role === "ADMIN") && (
              <SendToDoctorForm screeningId={screening.id} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
