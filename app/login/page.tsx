"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DisclaimerBanner from "@/components/disclaimer-banner";
import { KeyRound, Mail, Lock, ShieldCheck, RefreshCw, LogIn } from "lucide-react";
import { useToast } from "@/components/toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Resend OTP countdown state
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "AdminOnly") {
      setError("Access Denied. Admin access only.");
    } else if (errorParam === "AccessDenied") {
      setError("Access Denied. Your account has been suspended. Please contact administration.");
    } else if (errorParam) {
      setError("Authentication failed. Please try again.");
    }
  }, [searchParams]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Step 1: Pre-login credentials validation & OTP request
  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/pre-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Incorrect email or password. Please try again.");
      }

      setOtpSent(true);
      setCountdown(30); // 30 seconds countdown
      toast.success("Verification code sent to your email!");
    } catch (err: any) {
      setError(err.message ?? "Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Complete NextAuth login with OTP
  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP code.");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        otp,
        redirect: false,
      });

      if (result?.error) {
        // Handle failed login
        setError(result.error || "Incorrect OTP code. Please try again.");
        toast.error("Authentication failed.");
        setLoading(false);
        return;
      }

      toast.success("Login successful!");
      router.push("/api/post-login-redirect");
      router.refresh();
    } catch (err) {
      setError("Incorrect OTP code. Please try again.");
      setLoading(false);
    }
  }

  // Google OAuth flow
  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/api/post-login-redirect" });
    } catch (err) {
      setError("Google authentication failed.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200">
      <DisclaimerBanner />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="text-center sm:text-left">
          <h1 className="animate-fade-up font-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Log in to DrishAI
          </h1>
          <p className="mt-1 animate-fade-up text-sm text-neutral-500 dark:text-neutral-400" style={{ animationDelay: "40ms" }}>
            {otpSent ? "Verify your email to continue." : "Use your registered email or Google account."}
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 px-3.5 py-2.5 text-sm text-red-700 dark:text-red-400 animate-fade-up">
            {error}
          </p>
        )}

        {!otpSent ? (
          /* Credentials Step 1 Form */
          <form onSubmit={handleRequestOtp} className="mt-6 animate-fade-up space-y-4" style={{ animationDelay: "85ms" }}>
            <div>
              <label className="label dark:text-neutral-300" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  required
                  className="input-field !pl-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label !mb-1.5 dark:text-neutral-300" htmlFor="password">Password</label>
                <Link href="/forgot-password" className="mb-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-neutral-400" />
                <input
                  id="password"
                  type="password"
                  required
                  className="input-field !pl-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full flex items-center gap-2">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Checking credentials…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> Log In & Request OTP
                </>
              )}
            </button>
          </form>
        ) : (
          /* OTP Verification Step 2 Form */
          <form onSubmit={handleVerifyOtp} className="mt-6 animate-fade-up space-y-4">
            <div className="rounded-lg bg-brand-50 border border-brand-100 p-4 dark:bg-brand-950/20 dark:border-brand-900/50">
              <p className="text-xs text-brand-850 dark:text-brand-300 font-medium">
                We've sent a 6-digit security code to <strong>{email}</strong>. It will expire in 5 minutes.
              </p>
            </div>
            <div>
              <label className="label dark:text-neutral-300" htmlFor="otp">Enter Verification Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3.5 h-4.5 w-4.5 text-neutral-400" />
                <input
                  id="otp"
                  type="text"
                  required
                  maxLength={6}
                  className="input-field !pl-10 font-mono tracking-[0.25em] text-lg font-bold dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center gap-2">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : (
                "Verify Code & Log In"
              )}
            </button>

            <div className="flex items-center justify-between text-xs mt-2">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:underline font-medium"
              >
                Change password / email
              </button>

              <button
                type="button"
                disabled={countdown > 0}
                onClick={handleRequestOtp}
                className={`font-semibold transition ${
                  countdown > 0
                    ? "text-neutral-400 cursor-not-allowed"
                    : "text-brand-700 dark:text-brand-400 hover:underline"
                }`}
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP Code"}
              </button>
            </div>
          </form>
        )}

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-250 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-xs font-semibold uppercase">
            <span className="bg-neutral-50 dark:bg-neutral-900 px-3 text-neutral-500 dark:text-neutral-400">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={loading || googleLoading}
          onClick={handleGoogleLogin}
          className="btn-secondary w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 hover:bg-neutral-50"
        >
          {googleLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.37 0 3.393 2.671 1.482 6.557l3.784 3.208z"
              />
              <path
                fill="#4285F4"
                d="M23.636 12.273c0-.818-.073-1.609-.209-2.373H12v4.582h6.527c-.281 1.48-.1.977-.852 1.977l3.771 3.2c2.203-2.03 3.636-5.013 3.636-8.386z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235A7.077 7.077 0 0 1 4.909 12c0-.79.13-1.554.357-2.235L1.482 6.557A11.956 11.956 0 0 0 0 12c0 1.954.47 3.8 1.3 5.443l3.966-3.208z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.956-1.077 7.944-2.918l-3.771-3.2c-1.045.7-2.383 1.118-4.173 1.118-3.218 0-5.945-2.173-6.918-5.1l-3.966 3.208C3.393 21.329 7.37 24 12 24z"
              />
            </svg>
          )}
          {googleLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">
            Register
          </Link>
        </p>

        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 dark:bg-neutral-800/40 dark:border-neutral-700/60 p-3 text-xs text-neutral-500 dark:text-neutral-400">
          Demo accounts (after seeding): admin@drishai.dev · doctor@drishai.dev ·
          ngo@drishai.dev · patient@drishai.dev — password: <code>password123</code>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}