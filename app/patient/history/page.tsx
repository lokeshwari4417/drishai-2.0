import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SeverityBadge from "@/components/severity-badge";

export default async function PatientHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
    include: { screenings: { orderBy: { screeningDate: "desc" }, include: { images: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Your screening history</h1>
          <p className="mt-1 text-sm text-neutral-500">Every scan you've taken, most recent first.</p>
        </div>
        <Link href="/patient/scan" className="btn-primary">+ New scan</Link>
      </div>

      {!patient || patient.screenings.length === 0 ? (
        <div className="card mt-6 text-center text-sm text-neutral-500">
          No scans yet. Start your first screening.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patient.screenings.map((s) => (
            <Link
              key={s.id}
              href={`/patient/history/${s.id}`}
              className="card block transition hover:shadow-md"
            >
              {s.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.images[0].imagePath}
                  alt="Fundus scan"
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                />
              )}
              <SeverityBadge stageKey={s.drStage} />
              <p className="mt-2 text-xs text-neutral-500">
                {new Date(s.screeningDate).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
