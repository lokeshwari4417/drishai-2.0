"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import SeverityBadge from "@/components/severity-badge";
import type { DrStageKey } from "@/lib/dr-stages";

interface TriageItem {
  screeningId: string;
  patientId: string;
  patientName: string;
  drStage: DrStageKey | null;
  grade: number;
  confidenceScore: number | null;
  screeningDate: string;
  imagePath: string | null;
}

export default function TriageQueuePage() {
  const [items, setItems] = useState<TriageItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/triage")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setItems)
      .catch(() => setError("Couldn't load the triage queue."));
  }, []);

  return (
    <div>
      <div className="flex animate-fade-up items-center gap-2">
        <AlertTriangle size={20} className="text-accent-500" />
        <h1 className="font-display text-2xl text-neutral-900">Triage queue</h1>
      </div>
      <p className="mt-1 animate-fade-up text-sm text-neutral-500" style={{ animationDelay: "40ms" }}>
        Your screenings, most severe first — so the cases that need attention soonest surface to the top.
      </p>

      <div className="stagger mt-6 space-y-3">
        {error && <div className="card text-sm text-red-600">{error}</div>}
        {!error && items === null && <div className="card text-sm text-neutral-400">Loading…</div>}
        {items?.length === 0 && (
          <div className="card text-sm text-neutral-400">No screenings yet — nothing to triage.</div>
        )}
        {items?.map((item) => (
          <Link
            key={item.screeningId}
            href={`/report/${item.screeningId}`}
            className="card-interactive flex items-center gap-4"
          >
            {item.imagePath && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imagePath} alt="Fundus scan" className="h-14 w-14 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <p className="font-medium text-neutral-900">{item.patientName}</p>
              <p className="text-xs text-neutral-400">
                {new Date(item.screeningDate).toLocaleDateString()}
                {item.confidenceScore != null && ` · ${Math.round(item.confidenceScore * 100)}% confidence`}
              </p>
            </div>
            <SeverityBadge stageKey={item.drStage} />
          </Link>
        ))}
      </div>
    </div>
  );
}
