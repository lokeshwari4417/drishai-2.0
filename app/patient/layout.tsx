import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardNav from "@/components/dashboard-nav";
import DisclaimerBanner from "@/components/disclaimer-banner";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "PATIENT" && session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNav name={session.user.name} role={session.user.role} />
      <DisclaimerBanner />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
