import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ScanUpload from "@/components/scan-upload";

export default async function PatientScanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });

  if (!patient) {
    return (
      <div className="card">
        <p className="text-sm text-neutral-600">
          We couldn't find a patient profile linked to your account. Please contact your clinic or NGO to set one up.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">New scan</h1>
      <p className="mt-1 text-sm text-neutral-500">Capture or upload a retinal fundus image to screen for diabetic retinopathy.</p>
      <div className="mt-6">
        <ScanUpload patientId={patient.id} reportBasePath="/patient/history" />
      </div>
    </div>
  );
}
