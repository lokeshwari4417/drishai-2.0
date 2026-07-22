"use client";

import { signOut } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  NGO: "NGO / Organization",
  ADMIN: "Admin",
};

export default function DashboardNav({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-brand-700">DrishAI</span>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {ROLE_LABELS[role] ?? role}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600">{name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-secondary !px-3 !py-1.5 text-xs"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
