import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/profile-form";

export default async function PatientProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Your profile</h1>
      <p className="mt-1 text-sm text-neutral-500">Personal information and account settings.</p>

      <div className="mt-6 max-w-lg">
        <ProfileForm
          name={session.user.name}
          email={session.user.email}
          age={patient?.age}
          gender={patient?.gender}
          contactNumber={patient?.contactNumber ?? undefined}
          isPatient={true}
        />
      </div>
    </div>
  );
}
