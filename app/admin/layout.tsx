import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardNav from "@/components/dashboard-nav";
import DisclaimerBanner from "@/components/disclaimer-banner";
import ChatbotWidget from "@/components/chatbot-widget";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardNav name={session.user.name} role={session.user.role} />
      <DisclaimerBanner />
      <ChatbotWidget />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
