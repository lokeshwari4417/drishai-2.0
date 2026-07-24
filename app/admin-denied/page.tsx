"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function AdminDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12 dark:bg-neutral-900 transition-colors duration-200">
      <div className="card max-w-md w-full text-center border border-red-200 bg-white p-8 shadow-md dark:bg-neutral-800 dark:border-neutral-700/60 transition-all duration-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <ShieldAlert size={28} />
        </div>
        
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Access Denied.
        </h1>
        
        <p className="mt-3 text-base text-neutral-600 dark:text-neutral-300">
          Admin access only.
        </p>
        
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Your current account role does not have permission to view this resource.
        </p>
        
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/api/post-login-redirect"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            Go to Your Dashboard
          </Link>
          
          <Link
            href="/login"
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Log In as Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
