"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import DisclaimerBanner from "@/components/disclaimer-banner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <DisclaimerBanner />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <h1 className="animate-fade-up font-display text-2xl text-neutral-900">Reset your password</h1>
        <p className="mt-1 animate-fade-up text-sm text-neutral-500" style={{ animationDelay: "40ms" }}>
          Enter your account email and we'll send you a reset link.
        </p>

        {submitted ? (
          <div className="mt-6 animate-fade-up rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
            If an account exists for <strong>{email}</strong>, we've sent a reset link. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 animate-fade-up space-y-4" style={{ animationDelay: "80ms" }}>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}
