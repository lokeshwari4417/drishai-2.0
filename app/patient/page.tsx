import { ScanEye, History, UserCircle, MessageCircle } from "lucide-react";
import DashboardCard from "@/components/dashboard-card";

const CARDS = [
  { icon: ScanEye, title: "Take / upload a scan", desc: "Start a new retinal screening", href: "/patient/scan", cta: "Start screening" },
  { icon: History, title: "My previous scans", desc: "View past screenings and reports", href: "/patient/history", cta: "View history" },
  { icon: UserCircle, title: "My profile", desc: "Name, personal info, password", href: "/patient/profile", cta: "Edit profile" },
  { icon: MessageCircle, title: "Voice assistant & chatbot", desc: "Get guided help through the app", href: "#chatbot", cta: "Open the chat bubble" },
];

export default function PatientHome() {
  return (
    <div>
      <h1 className="animate-fade-up font-display text-2xl text-neutral-900">Welcome back</h1>
      <p className="mt-1 animate-fade-up text-sm text-neutral-500" style={{ animationDelay: "40ms" }}>
        This is your patient dashboard.
      </p>

      <div className="stagger mt-6 grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <DashboardCard key={c.title} {...c} />
        ))}
      </div>
    </div>
  );
}
