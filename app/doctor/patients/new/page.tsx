import PatientForm from "@/components/patient-form";

export default function NewPatientPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">New patient</h1>
      <p className="mt-1 text-sm text-neutral-500">Create a patient profile before their first screening.</p>

      <div className="card mt-6 max-w-xl">
        <PatientForm />
      </div>
    </div>
  );
}
