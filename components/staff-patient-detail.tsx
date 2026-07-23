import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SeverityBadge from "@/components/severity-badge";
import ScanUpload from "@/components/scan-upload";

export default async function StaffPatientDetail({ patientId }: { patientId: string }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { screenings: { orderBy: { screeningDate: "desc" }, include: { images: true } } },
  });

  if (!patient) notFound();

  const allowed = session.user.role === "ADMIN" || patient.createdById === session.user.id;
  if (!allowed) redirect("/login");

  const reportBasePath = "/report";

  return (
    <div>
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">{patient.name}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {patient.age} years · {patient.gender}
              {patient.diabetesDuration != null && ` · Diabetic for ${patient.diabetesDuration} yrs`}
            </p>
            {patient.contactNumber && (
              <p className="mt-1 text-sm text-neutral-500">{patient.contactNumber}</p>
            )}
          </div>
          <SeverityBadge stageKey={patient.screenings[0]?.drStage} />
        </div>
      </div>

      <div className="mt-6">
        <ScanUpload patientId={patient.id} reportBasePath={reportBasePath} />
      </div>

      <h2 className="mt-8 text-lg font-medium text-neutral-900">Scan history</h2>
      {patient.screenings.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">No screenings yet.</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patient.screenings.map((s) => (
            <Link key={s.id} href={`/report/${s.id}`} className="card block transition hover:shadow-md">
              {s.images[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.images[0].imagePath} alt="Fundus scan" className="mb-3 h-32 w-full rounded-lg object-cover" />
              )}
              <SeverityBadge stageKey={s.drStage} />
              <p className="mt-2 text-xs text-neutral-500">{new Date(s.screeningDate).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
