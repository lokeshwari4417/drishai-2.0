"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, History, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface LoginRecord {
  id: string;
  userId: string;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  loggedAt: string;
  user: { name: string; email: string };
}

export default function AdminLoginHistoryPage() {
  const [history, setHistory] = useState<LoginRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/login-history");
      if (!res.ok) throw new Error();
      setHistory(await res.json());
    } catch {
      setError("Failed to load login audit history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline mb-1">
          <ArrowLeft size={13} />
          Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <History className="text-brand-600" size={24} />
          Login Audit History
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Track and audit successful, failed, or blocked authentication attempts.
        </p>
      </div>

      <div className="card overflow-hidden !p-0 bg-white dark:bg-neutral-800 dark:border-neutral-700/60 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 dark:bg-neutral-900/40 dark:border-neutral-700 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">User Details</th>
                <th className="px-4 py-3 font-medium">Authentication Status</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">User Agent (Device Info)</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">Loading audit history...</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-red-600 dark:text-red-400">{error}</td>
                </tr>
              )}
              {!loading && !error && history?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">No login attempts recorded in database.</td>
                </tr>
              )}
              {history?.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">{log.user.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{log.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : log.status === "BLOCKED"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs dark:text-neutral-300">{log.ipAddress || "Unknown"}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-300 max-w-xs truncate" title={log.userAgent || ""}>
                    {log.userAgent || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-neutral-400 dark:text-neutral-500">
                    {new Date(log.loggedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
