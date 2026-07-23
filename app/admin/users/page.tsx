"use client";

import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "PATIENT" | "DOCTOR" | "NGO" | "ADMIN";
  createdAt: string;
  _count: { createdPatients: number };
}

const ROLES = ["PATIENT", "DOCTOR", "NGO", "ADMIN"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to load users");
      setUsers(await res.json());
    } catch {
      setError("Couldn't load users.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeRole(id: string, role: string) {
    setBusyId(id);
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await load();
    setBusyId(null);
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setBusyId(id);
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    await load();
    setBusyId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">User management</h1>
      <p className="mt-1 text-sm text-neutral-500">Change roles or remove accounts.</p>

      <div className="card mt-6 overflow-hidden !p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Patients managed</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-red-600">{error}</td></tr>
            )}
            {!error && users === null && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
            )}
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 font-medium text-neutral-900">{u.name}</td>
                <td className="px-4 py-3 text-neutral-600">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="input-field !py-1.5 text-xs"
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-neutral-600">{u._count.createdPatients}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteUser(u.id)}
                    disabled={busyId === u.id}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
