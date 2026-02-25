"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await signUp(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          setSignUpSuccess(true);
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  if (signUpSuccess) {
    return (
      <div className="flex flex-col h-dvh items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="text-4xl">&#9993;</div>
          <h2 className="text-xl font-bold">Check your email</h2>
          <p className="text-muted text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Click the
            link to activate your account, then come back and sign in.
          </p>
          <button
            onClick={() => {
              setSignUpSuccess(false);
              setMode("login");
            }}
            className="text-primary font-medium text-sm"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Peptide</span> Pal
          </h1>
          <p className="text-muted text-sm mt-2">
            Track your peptide injections with precision
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger/10 text-danger rounded-2xl p-3 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-4 rounded-2xl disabled:opacity-50 press-spring"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className="text-primary font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="text-primary font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
