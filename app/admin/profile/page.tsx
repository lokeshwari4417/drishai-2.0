import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/profile-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline mb-1">
          <ArrowLeft size={13} />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-display">
          Your Profile
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Manage your administrator profile details and change password credentials.
        </p>
      </div>

      <div className="max-w-lg">
        <ProfileForm
          name={session.user.name}
          email={session.user.email}
          contactNumber={user?.phoneNumber ?? undefined}
          isPatient={false}
        />
      </div>
    </div>
  );
}
