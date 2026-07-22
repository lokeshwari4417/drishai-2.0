import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface ScreeningWithRelations {
  id: string;
  screeningDate: Date;
  drStage: string | null;
  confidenceScore: number | null;
  images: { eyeSide: string }[];
}

const STAGE_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  NO_DR: {
    label: "No Retinopathy (Normal)",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  MILD: {
    label: "Mild NPDR",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  MODERATE: {
    label: "Moderate NPDR",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  SEVERE: {
    label: "Severe NPDR",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  PROLIFERATIVE: {
    label: "Proliferative DR",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
};

export default async function ScreeningHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch the patient profile for the logged in user
  let patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });

  // Fallback for testing with Admin or non-patient profiles
  if (!patient) {
    patient = await prisma.patient.findFirst();
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-semibold text-neutral-800">No Patient Profile</h2>
        <p className="mt-2 text-neutral-500">Could not retrieve patient records.</p>
      </div>
    );
  }

  const screenings = await prisma.screeningRecord.findMany({
    where: { patientId: patient.id },
    orderBy: { screeningDate: "desc" },
    include: {
      images: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Screening History</h1>
          <p className="mt-2 text-sm text-neutral-500">
            View all past AI-assisted screenings and retinal examinations for <span className="font-semibold text-neutral-700">{patient.name}</span>.
          </p>
        </div>
        <Link
          href="/patient/screening/new"
          className="mt-4 sm:mt-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition self-start"
        >
          + New Screening
        </Link>
      </div>

      {screenings.length === 0 ? (
        <div className="mt-12 text-center border-2 border-dashed border-neutral-300 rounded-2xl p-12">
          <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">No screenings found</h3>
          <p className="mt-1 text-sm text-neutral-500">Get started by uploading your first retinal scan.</p>
          <div className="mt-6">
            <Link
              href="/patient/screening/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Start New Screening
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {screenings.map((screening) => {
            const dateStr = new Date(screening.screeningDate).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            // Map eye sides
            const eyes = screening.images.map((img) => img.eyeSide);
            let eyesLabel = "";
            if (eyes.includes("LEFT") && eyes.includes("RIGHT")) {
              eyesLabel = "Left & Right Eyes";
            } else if (eyes.includes("LEFT")) {
              eyesLabel = "Left Eye Only";
            } else if (eyes.includes("RIGHT")) {
              eyesLabel = "Right Eye Only";
            } else {
              eyesLabel = "No scan images linked";
            }

            const stageConf = screening.drStage
              ? STAGE_CONFIGS[screening.drStage]
              : { label: "Pending", bg: "bg-neutral-100", text: "text-neutral-700", border: "border-neutral-200" };

            const confPercent = screening.confidenceScore
              ? `${(screening.confidenceScore * 100).toFixed(1)}%`
              : "N/A";

            return (
              <div
                key={screening.id}
                className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between transition duration-150"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-neutral-400">ID: {screening.id.substring(0, 8)}</span>
                    <span className="text-xs text-neutral-500">•</span>
                    <span className="text-sm font-medium text-neutral-600">{eyesLabel}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-neutral-800">{dateStr}</h3>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${stageConf.bg} ${stageConf.text} ${stageConf.border}`}
                    >
                      {stageConf.label}
                    </span>
                    {screening.drStage && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-neutral-100 text-neutral-600 border border-neutral-200">
                        AI Confidence: {confPercent}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex gap-2">
                  <Link
                    href={`/patient/screening/${screening.id}`}
                    className="flex-1 md:flex-initial text-center px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg transition"
                  >
                    View Report
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
