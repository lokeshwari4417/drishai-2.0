import Link from "next/link";

const CARDS = [
  { title: "Take / upload a scan", desc: "Start a new retinal screening", href: "/patient/screening/new", cta: "Start screening" },
  { title: "My previous scans", desc: "View past screenings and reports", href: "/patient/screening/history", cta: "View history" },
  { title: "My profile", desc: "Name, personal info, password", href: "#", cta: "Edit profile" },
  { title: "Voice assistant & chatbot", desc: "Get guided help through the app", href: "#", cta: "Open assistant" },
];

export default function PatientHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Welcome back</h1>
      <p className="mt-1 text-sm text-neutral-500">
        This is your patient dashboard. Scan capture, history, and reporting are
        built next — this scaffold gives you working auth and routing to build on.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.title} className="card flex flex-col justify-between">
            <div>
              <h2 className="font-medium text-neutral-900">{c.title}</h2>
              <p className="mt-1 text-sm text-neutral-500">{c.desc}</p>
            </div>
            <Link href={c.href} className="btn-secondary mt-4 self-start">
              {c.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
