"use client";

import { useState, FormEvent } from "react";
import { signOut } from "next-auth/react";

export default function ProfileForm({
  name,
  email,
  age,
  gender,
  contactNumber,
}: {
  name: string;
  email: string;
  age?: number;
  gender?: string;
  contactNumber?: string;
}) {
  const [ageVal, setAgeVal] = useState(age?.toString() ?? "");
  const [genderVal, setGenderVal] = useState(gender ?? "Female");
  const [contactVal, setContactVal] = useState(contactNumber ?? "");
  const [infoSaved, setInfoSaved] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function saveInfo(e: FormEvent) {
    e.preventDefault();
    setInfoLoading(true);
    setInfoError(null);
    setInfoSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(ageVal ? { age: Number(ageVal) } : {}),
          gender: genderVal,
          contactNumber: contactVal,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setInfoSaved(true);
    } catch (err: any) {
      setInfoError(err.message ?? "Save failed");
    } finally {
      setInfoLoading(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setPwError(null);
    setPwSaved(false);

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't change password");
      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwError(err.message ?? "Couldn't change password");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-medium text-neutral-900">Personal information</h2>
        <form onSubmit={saveInfo} className="mt-4 space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input-field bg-neutral-50" value={name} disabled />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input-field bg-neutral-50" value={email} disabled />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Age</label>
              <input type="number" className="input-field" value={ageVal} onChange={(e) => setAgeVal(e.target.value)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" value={genderVal} onChange={(e) => setGenderVal(e.target.value)}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Contact number</label>
            <input className="input-field" value={contactVal} onChange={(e) => setContactVal(e.target.value)} />
          </div>

          {infoError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{infoError}</p>}
          {infoSaved && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Saved.</p>}

          <button type="submit" disabled={infoLoading} className="btn-primary">
            {infoLoading ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-medium text-neutral-900">Password manager</h2>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              minLength={8}
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {pwError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwError}</p>}
          {pwSaved && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Password updated.</p>}

          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? "Updating…" : "Change password"}
          </button>
        </form>
      </div>

      <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-secondary">
        Log out
      </button>
    </div>
  );
}
