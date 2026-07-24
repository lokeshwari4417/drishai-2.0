import Link from "next/link";
import PatientTable from "@/components/patient-table";

export default function DoctorHome() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="animate-fade-up">
          <h1 className="font-display text-2xl text-neutral-900 dark:text-neutral-50">Patients</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Click a patient to view their profile and scan history.</p>
        </div>
        <Link href="/doctor/patients/new" className="btn-primary animate-fade-up">+ New patient</Link>
      </div>

      <div className="mt-4 animate-fade-up">
        <Link href="/doctor/triage" className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:underline">
          View triage queue (most severe cases first) →
        </Link>
      </div>

      <div className="mt-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <PatientTable basePath="/doctor/patients" />
      </div>
    </div>
  );
}
