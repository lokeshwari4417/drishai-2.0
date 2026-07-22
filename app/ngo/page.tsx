const CARDS = [
  { title: "Bulk patient management", desc: "Register many patients at a screening camp" },
  { title: "Send report to doctor", desc: "Route a screened patient's report for review" },
  { title: "All associated patients", desc: "Every patient this organization manages" },
];

export default function NgoHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Organization dashboard</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Same tools as a Doctor account, plus scale features for screening camps.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.title} className="card">
            <h2 className="font-medium text-neutral-900">{c.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
