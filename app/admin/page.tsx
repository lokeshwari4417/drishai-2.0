const STATS = [
  { label: "Total users", value: "—" },
  { label: "Patients", value: "—" },
  { label: "Screenings this month", value: "—" },
  { label: "Flagged / moderation", value: "—" },
];

export default function AdminHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Platform overview</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage users, roles, records, and moderation from here.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-neutral-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6">
        <h2 className="font-medium text-neutral-900">User management</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Wire this up to list/edit/deactivate users and change roles via the Prisma
          <code className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5 text-xs">User</code>
          model already defined in <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">prisma/schema.prisma</code>.
        </p>
      </div>
    </div>
  );
}
