import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ScreeningWizard from "./screening-wizard";

export default async function NewScreeningPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch the patient profile for the logged in user
  let patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });

  // Fallback for ADMIN users or accounts without profile: bind to first patient for testing
  if (!patient) {
    patient = await prisma.patient.findFirst();
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-semibold text-neutral-800">No Patient Profile</h2>
        <p className="mt-2 text-neutral-500">
          A patient profile is required to run screenings. Please seed the database or register as a patient.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">New Retinal Screening</h1>
        <p className="mt-2 text-neutral-500">
          Submit retinal fundus scans to run the AI diabetic retinopathy analysis.
        </p>
      </div>

      <ScreeningWizard patientId={patient.id} patientName={patient.name} />
    </div>
  );
}
