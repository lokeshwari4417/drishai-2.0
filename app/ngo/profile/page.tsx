import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/profile-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NgoProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-6 py-4 backdrop-blur dark:bg-neutral-900/90 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-xl italic tracking-tight text-brand-700 dark:text-brand-400">
            Drish<span className="not-italic">AI</span>
          </span>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-400">
            NGO Coordinator Settings
          </span>
        </div>
        <Link href="/ngo" className="btn-secondary !px-3 !py-1.5 text-xs flex items-center gap-1">
          <ArrowLeft size={13} />
          Go to Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 font-display">
            Your Profile
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Update NGO organization account details and password credentials.
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
      </main>
    </div>
  );
}
