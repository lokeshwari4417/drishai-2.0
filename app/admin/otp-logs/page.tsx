"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";

interface OtpRecord {
  id: string;
  code: string;
  expiresAt: string;
  resendAt: string;
  createdAt: string;
  user: { name: string; email: string };
}

export default function AdminOtpLogsPage() {
  const [otps, setOtps] = useState<OtpRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOtps() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/otp-logs");
      if (!res.ok) throw new Error();
      setOtps(await res.json());
    } catch {
      setError("Failed to load OTP records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOtps();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline mb-1">
          <ArrowLeft size={13} />
          Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <KeyRound className="text-brand-600" size={24} />
          Pending OTP Codes
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Monitor currently active, non-verified 6-digit OTP tokens stored in the system.
        </p>
      </div>

      <div className="card overflow-hidden !p-0 bg-white dark:bg-neutral-800 dark:border-neutral-700/60 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 dark:bg-neutral-900/40 dark:border-neutral-700 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">User Details</th>
                <th className="px-4 py-3 font-medium">OTP Code</th>
                <th className="px-4 py-3 font-medium">Created At</th>
                <th className="px-4 py-3 font-medium">Resend Timer Ends At</th>
                <th className="px-4 py-3 font-medium">Expires At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">Loading active OTP records...</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-red-600 dark:text-red-400">{error}</td>
                </tr>
              )}
              {!loading && !error && otps?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">No active OTP records in database (OTPs are deleted instantly after successful validation).</td>
                </tr>
              )}
              {otps?.map((otp) => {
                const expired = new Date(otp.expiresAt) < new Date();
                return (
                  <tr key={otp.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{otp.user.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{otp.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-brand-50 px-2 py-1 font-mono text-sm font-bold text-brand-850 dark:bg-brand-950/60 dark:text-brand-400">
                        {otp.code}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                      {new Date(otp.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-neutral-600 dark:text-neutral-300">
                      {new Date(otp.resendAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      <span className={expired ? "text-red-600 font-bold" : "text-emerald-600 font-semibold"}>
                        {new Date(otp.expiresAt).toLocaleString()} {expired && "(Expired)"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
