"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import DisclaimerBanner from "@/components/disclaimer-banner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't reset password");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message ?? "Couldn't reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        This reset link is missing its token. Please request a new one from the{" "}
        <Link href="/forgot-password" className="underline">forgot password</Link> page.
      </p>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Password updated. Redirecting you to log in…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="newPassword">New password</label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          className="input-field"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          className="input-field"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <DisclaimerBanner />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <h1 className="font-display text-2xl text-neutral-900">Set a new password</h1>
        <p className="mt-1 text-sm text-neutral-500">Choose a new password for your DrishAI account.</p>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-neutral-400">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
