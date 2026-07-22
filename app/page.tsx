import Link from "next/link";
import DisclaimerBanner from "@/components/disclaimer-banner";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <DisclaimerBanner />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Privacy-first · On-device AI
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
          DrishAI
        </h1>
        <p className="mt-3 text-lg text-neutral-600">
          Eye health screening in seconds
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-500">
          Upload a retinal fundus image and get an instant AI severity grade
          for diabetic retinopathy — built for clinics, NGOs, and rural
          screening camps.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/register" className="btn-primary">
            Create an account
          </Link>
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
