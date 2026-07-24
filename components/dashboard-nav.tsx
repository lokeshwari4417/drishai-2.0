"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Sun, Moon, LogOut, User } from "lucide-react";

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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const activeTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-6 py-4 backdrop-blur dark:bg-neutral-900/90 dark:border-neutral-800 transition-colors duration-200">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="font-display text-xl italic tracking-tight text-brand-700 dark:text-brand-400">
            Drish<span className="not-italic font-bold">AI</span>
          </span>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-400">
            {ROLE_LABELS[role] ?? role}
          </span>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          {role === "ADMIN" ? (
            <>
              <Link href="/admin" className="hover:text-brand-700 dark:hover:text-brand-450 transition-colors">
                Dashboard
              </Link>
              <Link href="/admin/users" className="hover:text-brand-700 dark:hover:text-brand-450 transition-colors">
                Users
              </Link>
              <Link href="/admin/login-history" className="hover:text-brand-700 dark:hover:text-brand-450 transition-colors">
                Login History
              </Link>
              <Link href="/admin/otp-logs" className="hover:text-brand-700 dark:hover:text-brand-450 transition-colors">
                Pending OTPs
              </Link>
              <Link href="/admin/profile" className="hover:text-brand-700 dark:hover:text-brand-450 transition-colors">
                My Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href={role === "PATIENT" ? "/patient" : role === "DOCTOR" ? "/doctor" : "/ngo"}
                className="hover:text-brand-700 dark:hover:text-brand-450 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href={`/${role.toLowerCase()}/profile`}
                className="hover:text-brand-700 dark:hover:text-brand-450 transition-colors"
              >
                My Profile
              </Link>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info & Settings Links */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-350">
          <User size={14} className="text-neutral-400" />
          <span>{name}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          aria-label="Toggle Theme"
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-secondary !px-3 !py-1.5 text-xs flex items-center gap-1"
          title="Sign Out"
        >
          <LogOut size={13} />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
