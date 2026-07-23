"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DisclaimerBanner from "@/components/disclaimer-banner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    // Session doesn't carry role synchronously here, so let a lightweight
    // server route decide the right dashboard for this user's role.
    router.push("/api/post-login-redirect");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col">
      <DisclaimerBanner />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6">
        <h1 className="animate-fade-up font-display text-2xl text-neutral-900">Log in to DrishAI</h1>
        <p className="mt-1 animate-fade-up text-sm text-neutral-500" style={{ animationDelay: "40ms" }}>
          Use your registered email and password.
        </p>

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
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-brand-700 hover:underline">
            Register
          </Link>
        </p>

        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-500">
          Demo accounts (after seeding): admin@drishai.dev · doctor@drishai.dev ·
          ngo@drishai.dev · patient@drishai.dev — password: <code>password123</code>
        </div>
      </div>
    </main>
  );
}
