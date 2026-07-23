"use client";

import { useRouter } from "next/navigation";
import PatientForm from "@/components/patient-form";

export default function NgoNewPatientPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">New patient</h1>
      <p className="mt-1 text-sm text-neutral-500">Create a patient profile before their first screening.</p>

      <div className="card mt-6 max-w-xl">
        <PatientForm
          onSaved={(id) => {
            router.push(`/ngo/patients/${id}`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
