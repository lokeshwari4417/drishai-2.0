import Link from "next/link";
import PatientTable from "@/components/patient-table";

export default function NgoHome() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="animate-fade-up">
          <h1 className="font-display text-2xl text-neutral-900">Organization dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Same tools as a Doctor account, plus bulk patient management for screening camps.
          </p>
        </div>
        <Link href="/ngo/patients/new" className="btn-primary animate-fade-up">+ New patient</Link>
      </div>

      <div className="mt-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <PatientTable basePath="/ngo/patients" />
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        Open any patient to screen them and, from their report, send it to a doctor for review.
      </p>
    </div>
  );
}
