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
          View every account, change roles, or remove users.
        </p>
        <a href="/admin/users" className="btn-primary mt-4 inline-flex">Manage users</a>
      </div>
    </div>
  );
}
