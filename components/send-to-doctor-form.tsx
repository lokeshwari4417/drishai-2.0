"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Doctor {
  id: string;
  name: string;
  email: string;
}

export default function SendToDoctorForm({ screeningId }: { screeningId: string }) {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [selected, setSelected] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((data) => {
        setDoctors(Array.isArray(data) ? data : []);
        if (data[0]) setSelected(data[0].id);
      })
      .catch(() => setDoctors([]));
  }, []);

  async function handleSend() {
    if (!selected) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/screenings/${screeningId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't send report");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Couldn't send report");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card">
      <h2 className="font-medium text-neutral-900">Send to doctor</h2>
      <p className="mt-1 text-sm text-neutral-500">Route this report to a doctor for review.</p>

      {doctors === null ? (
        <p className="mt-3 text-sm text-neutral-400">Loading doctors…</p>
      ) : doctors.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">No doctor accounts found yet.</p>
      ) : (
        <div className="mt-3 flex gap-2">
          <select className="input-field flex-1" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.name} ({d.email})
              </option>
            ))}
          </select>
          <button onClick={handleSend} disabled={sending} className="btn-primary">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      )}

      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
