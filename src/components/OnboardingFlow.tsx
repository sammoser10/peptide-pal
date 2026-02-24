"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";

const SYRINGE_OPTIONS = [
  {
    size: 0.3,
    units: 30,
    label: "0.3 mL (30 units)",
    description: "Best for small doses. Fine markings for precision.",
  },
  {
    size: 0.5,
    units: 50,
    label: "0.5 mL (50 units)",
    description: "Most common for peptide injections.",
  },
  {
    size: 1.0,
    units: 100,
    label: "1 mL (100 units)",
    description: "For larger doses or higher volume reconstitutions.",
  },
];

export default function OnboardingFlow() {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedSyringe, setSelectedSyringe] = useState(0.5);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syringe_size_ml: selectedSyringe,
          onboarding_completed: true,
        }),
      });
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        {step === 0 && (
          <>
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold">
                Welcome to <span className="text-primary">Peptide</span> Pal
              </h1>
              <p className="text-muted">
                Let&apos;s get you set up. This will only take a moment.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Get Started
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">What syringe do you use?</h2>
              <p className="text-muted text-sm">
                This helps us show your dose in units so you can draw up
                accurately.
              </p>
            </div>

            <div className="space-y-3">
              {SYRINGE_OPTIONS.map((opt) => (
                <button
                  key={opt.size}
                  onClick={() => setSelectedSyringe(opt.size)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    selectedSyringe === opt.size
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-sm text-muted mt-0.5">
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Continue"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
