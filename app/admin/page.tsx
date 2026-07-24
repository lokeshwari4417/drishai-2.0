"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  HeartPulse,
  ScanLine,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ListRestart,
  ArrowRight,
  TrendingUp,
  Activity,
  History,
} from "lucide-react";
import { useToast } from "@/components/toast";

interface AnalyticsData {
  summary: {
    users: number;
    patients: number;
    screenings: number;
    activeOtps: number;
  };
  rolesDistribution: Record<string, number>;
  loginStats: {
    success: number;
    failed: number;
    blocked: number;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    user: { name: string; email: string };
  }>;
  recentLogins: Array<{
    id: string;
    status: string;
    ipAddress: string | null;
    userAgent: string | null;
    loggedAt: string;
    user: { name: string; email: string };
  }>;
}

export default function AdminDashboardHome() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: toastError } = useToast();

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError("Failed to load analytics dashboard data.");
      toastError("Error loading system analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading system analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300">
        <p className="font-semibold">{error || "Something went wrong"}</p>
        <button onClick={fetchAnalytics} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  const loginTotal = data.loginStats.success + data.loginStats.failed + data.loginStats.blocked;
  const successRate = loginTotal > 0 ? Math.round((data.loginStats.success / loginTotal) * 100) : 100;

  const STATS = [
    { icon: Users, label: "Total Users", value: data.summary.users, color: "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400" },
    { icon: HeartPulse, label: "Patients", value: data.summary.patients, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
    { icon: ScanLine, label: "Screenings", value: data.summary.screenings, color: "bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400" },
    { icon: KeyRound, label: "Active OTPs", value: data.summary.activeOtps, color: "bg-accent-50 text-accent-600 dark:bg-accent-950 dark:text-accent-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Platform Security & Analytics
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Real-time audit records, login histories, user metrics, and account health parameters.
          </p>
        </div>
        <button onClick={fetchAnalytics} className="btn-secondary flex items-center gap-1.5 self-start sm:self-center">
          <ListRestart size={15} />
          Refresh
        </button>
      </div>

      {/* Numerical Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card-interactive bg-white dark:bg-neutral-800 dark:border-neutral-700/60 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{s.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon size={18} />
              </div>
            </div>
            <p className="mt-4 font-mono text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Distribution & Login Success Rate */}
        <div className="lg:col-span-1 space-y-6">
          {/* User distribution card */}
          <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700/60">
            <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-600" />
              Role Ratios
            </h2>
            <div className="mt-4 space-y-3">
              {Object.entries(data.rolesDistribution).map(([role, count]) => {
                const percentage = data.summary.users > 0 ? Math.round((count / data.summary.users) * 100) : 0;
                return (
                  <div key={role} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      <span>{role}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-700">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Login success rate card */}
          <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700/60">
            <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Login Security
            </h2>
            <div className="mt-4 flex flex-col items-center justify-center py-2">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-8 border-neutral-100 dark:border-neutral-700">
                <div
                  className="absolute inset-0 rounded-full border-8 border-transparent border-t-emerald-500"
                  style={{ transform: `rotate(${successRate * 3.6}deg)` }}
                />
                <span className="font-mono text-2xl font-bold text-neutral-950 dark:text-neutral-50">{successRate}%</span>
              </div>
              <p className="mt-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">Success rate of login requests</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-neutral-100 dark:border-neutral-700 pt-4 text-center text-xs">
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">Success</p>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{data.loginStats.success}</p>
              </div>
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">Failed</p>
                <p className="font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">{data.loginStats.failed}</p>
              </div>
              <div>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium">Blocked</p>
                <p className="font-mono font-bold text-neutral-700 dark:text-neutral-400 mt-0.5">{data.loginStats.blocked}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Event logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity Log */}
          <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700/60">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 pb-3">
              <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <Activity size={18} className="text-brand-600" />
                Recent System Activity
              </h2>
            </div>
            <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-700">
              {data.recentActivities.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-400">No recent activities.</p>
              ) : (
                data.recentActivities.map((act) => (
                  <div key={act.id} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <span className="rounded bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                        {act.action}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{act.details}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      By: {act.user.name} ({act.user.email})
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Logins */}
          <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700/60">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 pb-3">
              <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <History size={18} className="text-brand-600" />
                Recent Login Attempts
              </h2>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-700 pb-2">
                    <th className="py-2">User</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">IP Address</th>
                    <th className="py-2">Logged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/60">
                  {data.recentLogins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-neutral-400">No login attempts recorded.</td>
                    </tr>
                  ) : (
                    data.recentLogins.map((log) => (
                      <tr key={log.id} className="text-neutral-700 dark:text-neutral-300">
                        <td className="py-2 font-medium">
                          <div>{log.user.name}</div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-normal">{log.user.email}</div>
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : log.status === "BLOCKED"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2 font-mono text-[10px]">{log.ipAddress || "Unknown"}</td>
                        <td className="py-2 font-mono text-[10px] text-neutral-400 dark:text-neutral-500">
                          {new Date(log.loggedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Control Actions Section */}
      <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700/60">
        <h2 className="font-display text-lg font-semibold text-neutral-900 dark:text-neutral-50">Quick Administration Panels</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Jump to specialized security management views, verify active OTP codes, or audit security event history.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Link href="/admin/users" className="card-interactive flex items-center justify-between border-neutral-100 hover:border-brand-500 bg-neutral-50/50 dark:bg-neutral-900/20 p-4">
            <div>
              <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-50">User Manager</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Block, delete, change roles</p>
            </div>
            <ArrowRight size={16} className="text-brand-600" />
          </Link>
          <Link href="/admin/login-history" className="card-interactive flex items-center justify-between border-neutral-100 hover:border-brand-500 bg-neutral-50/50 dark:bg-neutral-900/20 p-4">
            <div>
              <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-50">Login Audit History</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">View connection addresses</p>
            </div>
            <ArrowRight size={16} className="text-brand-600" />
          </Link>
          <Link href="/admin/otp-logs" className="card-interactive flex items-center justify-between border-neutral-100 hover:border-brand-500 bg-neutral-50/50 dark:bg-neutral-900/20 p-4">
            <div>
              <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-50">Pending OTP Codes</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Track active mail logs</p>
            </div>
            <ArrowRight size={16} className="text-brand-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
