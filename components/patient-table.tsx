"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SeverityBadge from "@/components/severity-badge";
import type { DrStageKey } from "@/lib/dr-stages";

interface PatientRow {
  id: string;
  name: string;
  age: number;
  gender: string;
  screenings: { drStage: DrStageKey | null; screeningDate: string }[];
}

export default function PatientTable({ basePath }: { basePath: string }) {
  const [patients, setPatients] = useState<PatientRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load(query = "") {
    try {
      const res = await fetch(`/api/patients${query ? `?search=${encodeURIComponent(query)}` : ""}`);
      if (!res.ok) throw new Error("Failed to load patients");
      setPatients(await res.json());
    } catch (err) {
      setError("Couldn't load patients.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="card overflow-hidden !p-0">
      <div className="flex items-center justify-between border-b border-neutral-200 p-4">
        <input
          className="input-field max-w-xs"
          placeholder="Search patients by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Age / Gender</th>
            <th className="px-4 py-3 font-medium">Last screening</th>
            <th className="px-4 py-3 font-medium">DR stage</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {error && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-red-600">{error}</td>
            </tr>
          )}
          {!error && patients === null && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">Loading…</td>
            </tr>
          )}
          {!error && patients?.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                No patients yet — add your first one to get started.
              </td>
            </tr>
          )}
          {patients?.map((p) => {
            const latest = p.screenings[0];
            return (
              <tr key={p.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{p.name}</td>
                <td className="px-4 py-3 text-neutral-600">{p.age} · {p.gender}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {latest ? new Date(latest.screeningDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge stageKey={latest?.drStage} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`${basePath}/${p.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
