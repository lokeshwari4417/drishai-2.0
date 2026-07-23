import Link from "next/link";
import PatientTable from "@/components/patient-table";

export default function DoctorHome() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Patients</h1>
          <p className="mt-1 text-sm text-neutral-500">Click a patient to view their profile and scan history.</p>
        </div>
        <Link href="/doctor/patients/new" className="btn-primary">+ New patient</Link>
      </div>

      <div className="mt-6">
        <PatientTable basePath="/doctor/patients" />
      </div>
    </div>
  );
}
