"use client";

import { useEffect, useState } from "react";
import { KeyRound, Copy, Check, Search, ShieldAlert, Ban, UserCheck, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/toast";
import Link from "next/link";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "NGO" | "ADMIN";
  isBlocked: boolean;
  createdAt: string;
  _count: { createdPatients: number };
}

const ROLES = ["PATIENT", "DOCTOR", "NGO", "ADMIN"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<{ userId: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const toast = useToast();

  async function load() {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter) params.append("role", roleFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load users");
      setUsers(await res.json());
    } catch {
      setError("Couldn't load users.");
      toast.error("Failed to load users list.");
    }
  }

  useEffect(() => {
    // debounce search slightly for premium feel
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  async function changeRole(id: string, role: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      toast.success("User role updated successfully.");
      await load();
    } catch {
      toast.error("Failed to update user role.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleBlock(id: string, currentBlocked: boolean) {
    const actionText = currentBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

    setBusyId(id);
    try {
      const res = await fetch(`/api/users/${id}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !currentBlocked }),
      });
      if (!res.ok) throw new Error("Failed to toggle block status");
      
      toast.success(`User has been successfully ${currentBlocked ? "unblocked" : "blocked"}.`);
      await load();
    } catch {
      toast.error("Failed to change user block status.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      toast.success("User account deleted successfully.");
      await load();
    } catch {
      toast.error("Failed to delete user account.");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(id: string) {
    if (!confirm("Reset this user's password? Their current password will stop working immediately.")) return;
    setBusyId(id);
    setRevealedPassword(null);
    try {
      const res = await fetch(`/api/users/${id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRevealedPassword({ userId: id, password: data.tempPassword });
        toast.success("Temporary password generated.");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to reset password.");
    } finally {
      setBusyId(null);
    }
  }

  function copyPassword() {
    if (!revealedPassword) return;
    navigator.clipboard.writeText(revealedPassword.password);
    setCopied(true);
    toast.info("Password copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline mb-1">
            <ArrowLeft size={13} />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-50">User Management</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Change roles, block/unblock accounts, reset passwords, or delete users.</p>
        </div>
      </div>

      {revealedPassword && (
        <div className="flex animate-fade-up items-center gap-3 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 dark:bg-accent-950/30 dark:border-accent-900/50">
          <KeyRound size={16} className="shrink-0 text-accent-600 dark:text-accent-400" />
          <p className="flex-1 text-sm text-accent-800 dark:text-accent-200">
            New temporary password: <code className="rounded bg-white px-1.5 py-0.5 font-mono dark:bg-neutral-800 dark:text-accent-300">{revealedPassword.password}</code>
            {" "}— share this with the user securely and ask them to change it after logging in. This won't be shown again.
          </p>
          <button onClick={copyPassword} className="btn-secondary shrink-0 !px-3 !py-1.5 text-xs">
            {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-field !pl-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field sm:w-48 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden !p-0 bg-white dark:bg-neutral-800 dark:border-neutral-700/60 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 dark:bg-neutral-900/40 dark:border-neutral-700 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Patients Managed</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-red-600 dark:text-red-400">{error}</td></tr>
              )}
              {!error && users === null && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">Loading users…</td></tr>
              )}
              {!error && users !== null && users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400 dark:text-neutral-500">No users match the search criteria.</td></tr>
              )}
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-700 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{u.name}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input-field !py-1.5 text-xs max-w-[130px] dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.isBlocked
                          ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                    >
                      {u.isBlocked ? (
                        <>
                          <Ban size={12} /> Suspended
                        </>
                      ) : (
                        <>
                          <UserCheck size={12} /> Active
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{u._count.createdPatients}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3.5">
                      <button
                        onClick={() => toggleBlock(u.id, u.isBlocked)}
                        disabled={busyId === u.id}
                        className={`text-xs font-semibold hover:underline ${
                          u.isBlocked ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {u.isBlocked ? "Unsuspend" : "Suspend"}
                      </button>
                      <button
                        onClick={() => resetPassword(u.id)}
                        disabled={busyId === u.id}
                        className="text-xs font-medium text-brand-700 dark:text-brand-400 hover:underline"
                      >
                        Reset password
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={busyId === u.id}
                        className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
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
