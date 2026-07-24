import Link from "next/link";
import DisclaimerBanner from "@/components/disclaimer-banner";
import ScanRing from "@/components/scan-ring";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 transition-colors duration-200">
      <DisclaimerBanner />

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {/* Signature moment: an oversized, softly-animated scan ring sitting behind the headline —
            the visual thesis of the whole app, echoing the retinal scan itself. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-[0.35]">
          <ScanRing mode="loading" color="#1f7373" size={520} />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 opacity-[0.5]">
          <ScanRing mode="loading" color="#e8a33d" size={340} />
        </div>

        <span className="mb-5 inline-flex animate-fade-up items-center gap-1.5 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-medium text-brand-700 dark:border-brand-800 dark:bg-neutral-800/80 dark:text-brand-400 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          Privacy-first · On-device AI
        </span>

        <h1
          className="animate-fade-up font-display text-5xl italic tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Drish<span className="not-italic text-brand-600 dark:text-brand-400">AI</span>
        </h1>

        <p
          className="mt-4 animate-fade-up font-display text-xl text-neutral-700 dark:text-neutral-200 sm:text-2xl"
          style={{ animationDelay: "160ms" }}
        >
          Eye health screening in seconds
        </p>

        <p
          className="mx-auto mt-5 max-w-xl animate-fade-up text-sm text-neutral-500 dark:text-neutral-400 sm:text-base"
          style={{ animationDelay: "240ms" }}
        >
          Upload a retinal fundus image and get an instant AI severity grade
          for diabetic retinopathy — built for clinics, NGOs, and rural
          screening camps.
        </p>

        <div className="mt-9 flex animate-fade-up gap-3" style={{ animationDelay: "320ms" }}>
          <Link href="/register" className="btn-primary">
            Create an account
          </Link>
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
        </div>

        <div
          className="mt-16 grid animate-fade-up grid-cols-3 gap-8 border-t border-neutral-200 dark:border-neutral-800 pt-8 text-left sm:gap-16"
          style={{ animationDelay: "400ms" }}
        >
          {[
            ["0–4", "DR severity grades"],
            ["<3s", "on-device inference"],
            ["0", "images leave your device"],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="font-mono text-2xl font-semibold text-brand-700 dark:text-brand-400">{stat}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
