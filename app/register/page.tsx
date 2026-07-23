"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DisclaimerBanner from "@/components/disclaimer-banner";

type Role = "PATIENT" | "DOCTOR" | "NGO" | "ADMIN";

const ROLE_OPTIONS: { value: Role; label: string; blurb: string }[] = [
  { value: "PATIENT", label: "Patient", blurb: "Take/upload your own scans and view reports" },
  { value: "DOCTOR", label: "Doctor", blurb: "Manage patients and review AI screening results" },
  { value: "NGO", label: "NGO / Organization", blurb: "Run screening camps at scale" },
  { value: "ADMIN", label: "Admin", blurb: "Manage the platform, users, and roles" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("PATIENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      // Auto-login right after successful registration.
      const result = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);

      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push("/api/post-login-redirect");
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="flex min-h-screen flex-col">
      <DisclaimerBanner />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <h1 className="animate-fade-up font-display text-2xl text-neutral-900">Create your DrishAI account</h1>
        <p className="mt-1 animate-fade-up text-sm text-neutral-500" style={{ animationDelay: "40ms" }}>Choose the role that matches how you'll use DrishAI.</p>

        <form onSubmit={handleSubmit} className="mt-6 animate-fade-up space-y-4" style={{ animationDelay: "80ms" }}>
          <div>
            <label className="label">I am a...</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    role === opt.value
                      ? "border-brand-500 bg-brand-50 text-brand-800"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  <span className="block font-medium">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">{opt.blurb}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input
              id="name"
              required
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
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
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
