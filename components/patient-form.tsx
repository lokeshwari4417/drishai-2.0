"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface PatientFormProps {
  patientId?: string;
  initial?: { name: string; age: number; gender: string; diabetesDuration?: number; contactNumber?: string };
  onSaved?: (patientId: string) => void;
}

export default function PatientForm({ patientId, initial, onSaved }: PatientFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState(initial?.age?.toString() ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "Female");
  const [diabetesDuration, setDiabetesDuration] = useState(initial?.diabetesDuration?.toString() ?? "");
  const [contactNumber, setContactNumber] = useState(initial?.contactNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      age: Number(age),
      gender,
      ...(diabetesDuration ? { diabetesDuration: Number(diabetesDuration) } : {}),
      ...(contactNumber ? { contactNumber } : {}),
    };

    try {
      const res = await fetch(patientId ? `/api/patients/${patientId}` : "/api/patients", {
        method: patientId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setLoading(false);
      if (onSaved) {
        onSaved(data.id ?? patientId!);
      } else {
        router.push(`/doctor/patients/${data.id ?? patientId}`);
        router.refresh();
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message ?? "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input required className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Age</label>
          <input
            required
            type="number"
            min={0}
            max={130}
            className="input-field"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Gender</label>
          <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
            <option>Prefer not to say</option>
          </select>
        </div>
        <div>
          <label className="label">Diabetes duration (years)</label>
          <input
            type="number"
            min={0}
            className="input-field"
            value={diabetesDuration}
            onChange={(e) => setDiabetesDuration(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Contact number</label>
          <input className="input-field" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Saving…" : patientId ? "Save changes" : "Create patient"}
      </button>
    </form>
  );
}
