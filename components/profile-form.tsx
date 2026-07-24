"use client";

import { useState, FormEvent } from "react";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/toast";

export default function ProfileForm({
  name,
  email,
  age,
  gender,
  contactNumber,
  isPatient = false,
}: {
  name: string;
  email: string;
  age?: number;
  gender?: string;
  contactNumber?: string;
  isPatient?: boolean;
}) {
  const [nameVal, setNameVal] = useState(name);
  const [ageVal, setAgeVal] = useState(age?.toString() ?? "");
  const [genderVal, setGenderVal] = useState(gender ?? "Female");
  const [contactVal, setContactVal] = useState(contactNumber ?? "");
  
  const [infoLoading, setInfoLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const toast = useToast();

  async function saveInfo(e: FormEvent) {
    e.preventDefault();

    if (!nameVal.trim()) {
      toast.error("Name is required");
      return;
    }

    if (isPatient && ageVal && (Number(ageVal) < 0 || Number(ageVal) > 130 || !Number.isInteger(Number(ageVal)))) {
      toast.error("Please enter a valid age between 0 and 130.");
      return;
    }

    setInfoLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameVal,
          contactNumber: contactVal,
          ...(isPatient && ageVal ? { age: Number(ageVal) } : {}),
          ...(isPatient ? { gender: genderVal } : {}),
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      
      toast.success("Profile information updated successfully.");
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally {
      setInfoLoading(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    
    if (!currentPassword || !newPassword) {
      toast.error("Both password fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    setPwLoading(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't change password");
      
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message ?? "Couldn't change password");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700/60 shadow-sm">
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-100 dark:border-neutral-700/60 pb-3">
          Personal Information
        </h2>
        <form onSubmit={saveInfo} className="mt-4 space-y-4">
          <div>
            <label className="label dark:text-neutral-300">Name</label>
            <input
              className="input-field dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="label dark:text-neutral-300">Email Address</label>
            <input
              className="input-field bg-neutral-50 dark:bg-neutral-900/50 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
              value={email}
              disabled
            />
            <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">Registered email cannot be changed.</p>
          </div>
          
          {isPatient && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label dark:text-neutral-300">Age</label>
                <input
                  type="number"
                  min={0}
                  max={130}
                  className="input-field dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
                  value={ageVal}
                  onChange={(e) => setAgeVal(e.target.value)}
                />
              </div>
              <div>
                <label className="label dark:text-neutral-300">Gender</label>
                <select
                  className="input-field dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
                  value={genderVal}
                  onChange={(e) => setGenderVal(e.target.value)}
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="label dark:text-neutral-300">Contact Number</label>
            <input
              className="input-field dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
              value={contactVal}
              onChange={(e) => setContactVal(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <button type="submit" disabled={infoLoading} className="btn-primary mt-2">
            {infoLoading ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="card bg-white dark:bg-neutral-800 dark:border-neutral-700/60 shadow-sm">
        <h2 className="font-semibold text-neutral-900 dark:text-neutral-50 border-b border-neutral-100 dark:border-neutral-700/60 pb-3">
          Password Manager
        </h2>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <div>
            <label className="label dark:text-neutral-300">Current Password</label>
            <input
              type="password"
              className="input-field dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label dark:text-neutral-300">New Password</label>
            <input
              type="password"
              minLength={8}
              className="input-field dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>

          <button type="submit" disabled={pwLoading} className="btn-primary mt-2">
            {pwLoading ? "Updating…" : "Change Password"}
          </button>
        </form>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="btn-secondary w-full sm:w-auto"
      >
        Log out
      </button>
    </div>
  );
}
