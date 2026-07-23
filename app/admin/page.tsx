import { prisma } from "@/lib/prisma";
import { Users, HeartPulse, ScanLine, ArrowRight } from "lucide-react";

export default async function AdminHome() {
  const [userCount, patientCount, screeningCount] = await Promise.all([
    prisma.user.count(),
    prisma.patient.count(),
    prisma.screeningRecord.count({
      where: { screeningDate: { gte: new Date(new Date().setDate(1)) } },
    }),
  ]);

  const STATS = [
    { icon: Users, label: "Total users", value: userCount },
    { icon: HeartPulse, label: "Patients", value: patientCount },
    { icon: ScanLine, label: "Screenings this month", value: screeningCount },
  ];

  return (
    <div>
      <h1 className="animate-fade-up font-display text-2xl text-neutral-900">Platform overview</h1>
      <p className="mt-1 animate-fade-up text-sm text-neutral-500" style={{ animationDelay: "40ms" }}>
        Manage users, roles, records, and moderation from here.
      </p>

      <div className="stagger mt-6 grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="card-interactive">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <s.icon size={18} />
            </div>
            <p className="mt-3 text-sm text-neutral-500">{s.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 animate-fade-up" style={{ animationDelay: "160ms" }}>
        <h2 className="font-display text-lg text-neutral-900">User management</h2>
        <p className="mt-1 text-sm text-neutral-500">
          View every account, change roles, or remove users.
        </p>
        <a href="/admin/users" className="btn-primary mt-4 inline-flex items-center gap-1.5 group">
          Manage users
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}
