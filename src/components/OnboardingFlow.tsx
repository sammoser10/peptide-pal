"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import type { UserPreferences } from "@/lib/database.types";
import { ALL_INJECTION_SITES } from "./BodyMap";

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

const GOAL_OPTIONS = [
  { id: "fat_loss", label: "Fat Loss", icon: "🔥" },
  { id: "muscle_gain", label: "Muscle Gain", icon: "💪" },
  { id: "recovery", label: "Recovery & Healing", icon: "🩹" },
  { id: "anti_aging", label: "Anti-Aging", icon: "⏳" },
  { id: "sleep", label: "Better Sleep", icon: "😴" },
  { id: "cognitive", label: "Cognitive Enhancement", icon: "🧠" },
  { id: "energy", label: "More Energy", icon: "⚡" },
  { id: "skin_hair", label: "Skin & Hair", icon: "✨" },
  { id: "sexual_health", label: "Sexual Health", icon: "❤️" },
  { id: "immune", label: "Immune Support", icon: "🛡️" },
];

const TOTAL_STEPS = 6;

export default function OnboardingFlow() {
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Syringe
  const [selectedSyringe, setSelectedSyringe] = useState(0.5);

  // Step 2: Injection site preferences
  const [preferredSites, setPreferredSites] = useState<string[]>(
    ALL_INJECTION_SITES.map((s) => s.id)
  );

  // Step 3: Body comp
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");

  // Step 4: Goals
  const [goals, setGoals] = useState<string[]>([]);

  // Step 5: Experience & aggressiveness
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [aggressiveness, setAggressiveness] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  function toggleGoal(id: string) {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function toggleSite(id: string) {
    setPreferredSites((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleComplete() {
    setLoading(true);
    setError("");
    try {
      const preferences: UserPreferences = {
        sex: sex || undefined,
        age: age ? parseInt(age) : undefined,
        height_cm: heightCm ? parseFloat(heightCm) : undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : undefined,
        goals,
        experience_level: experience,
        aggressiveness,
        preferred_sites: preferredSites,
      };

      const res = await apiFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syringe_size_ml: selectedSyringe,
          onboarding_completed: true,
          preferences,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }

      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Group sites for display
  const siteGroups = [
    { label: "Upper Body", sites: ALL_INJECTION_SITES.filter((s) => s.group === "Upper") },
    { label: "Core", sites: ALL_INJECTION_SITES.filter((s) => s.group === "Core") },
    { label: "Lower Body", sites: ALL_INJECTION_SITES.filter((s) => s.group === "Lower") },
  ];

  return (
    <div className="flex flex-col h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Progress bar */}
        {step > 0 && (
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i < step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <>
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold">
                Welcome to <span className="text-primary">Peptide</span> Pal
              </h1>
              <p className="text-muted">
                Let&apos;s get you set up so the AI can build you a personalized
                dosing schedule. This takes about a minute.
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

        {/* Step 1: Syringe size */}
        {step === 1 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">What syringe do you use?</h2>
              <p className="text-muted text-sm">
                This helps show your dose in syringe units.
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
              onClick={() => setStep(2)}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-xl transition-colors"
            >
              Next
            </button>
          </>
        )}

        {/* Step 2: Injection site preferences */}
        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Injection Sites</h2>
              <p className="text-muted text-sm">
                Select the sites you&apos;re comfortable using. We&apos;ll help you rotate
                between these areas.
              </p>
            </div>

            <div className="space-y-4">
              {siteGroups.map((group) => (
                <div key={group.label}>
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.sites.map((site) => {
                      const isSelected = preferredSites.includes(site.id);
                      return (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => toggleSite(site.id)}
                          className={`px-3 py-2.5 rounded-xl text-sm text-left transition-all ${
                            isSelected
                              ? "bg-primary/10 border-2 border-primary text-foreground"
                              : "bg-surface border-2 border-border text-muted hover:border-primary/40"
                          }`}
                        >
                          <span className="font-medium">{site.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl transition-colors hover:bg-surface-hover"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={preferredSites.length < 2}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>

            {preferredSites.length < 2 && (
              <p className="text-xs text-muted text-center">
                Select at least 2 sites for proper rotation.
              </p>
            )}
          </>
        )}

        {/* Step 3: Body composition */}
        {step === 3 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">About You</h2>
              <p className="text-muted text-sm">
                This helps the AI tailor dosing to your body. All fields are
                optional.
              </p>
            </div>

            <div className="space-y-3">
              {/* Sex */}
              <div>
                <label className="block text-sm font-medium mb-1">Sex</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["male", "female", "other"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                        sex === s
                          ? "bg-primary text-white border-primary"
                          : "bg-surface border-border hover:bg-surface-hover"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="30"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-foreground"
                />
              </div>

              {/* Height & Weight side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="175"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="80"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-foreground"
                  />
                </div>
              </div>

              {/* Body fat */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Estimated Body Fat %
                </label>
                <input
                  type="number"
                  value={bodyFatPct}
                  onChange={(e) => setBodyFatPct(e.target.value)}
                  placeholder="15"
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl transition-colors hover:bg-surface-hover"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 4: Goals */}
        {step === 4 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">What are your goals?</h2>
              <p className="text-muted text-sm">
                Select all that apply. This shapes your dosing schedule.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = goals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors text-left ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface hover:border-primary/40"
                    }`}
                  >
                    <span className="text-lg">{goal.icon}</span>
                    <span className="text-sm font-medium">{goal.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl transition-colors hover:bg-surface-hover"
              >
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={goals.length === 0}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 5: Experience & Aggressiveness */}
        {step === 5 && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Your Approach</h2>
              <p className="text-muted text-sm">
                This helps the AI dial in the right intensity for you.
              </p>
            </div>

            <div className="space-y-4">
              {/* Experience level */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Peptide Experience
                </label>
                <div className="space-y-2">
                  {([
                    {
                      id: "beginner" as const,
                      label: "Beginner",
                      desc: "New to peptides or just getting started",
                    },
                    {
                      id: "intermediate" as const,
                      label: "Intermediate",
                      desc: "Used peptides before, familiar with protocols",
                    },
                    {
                      id: "advanced" as const,
                      label: "Advanced",
                      desc: "Experienced with multiple peptide cycles",
                    },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExperience(opt.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                        experience === opt.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface hover:border-primary/40"
                      }`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs text-muted">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aggressiveness */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  How aggressive do you want to be?
                </label>
                <div className="space-y-2">
                  {([
                    {
                      id: "conservative" as const,
                      label: "Conservative",
                      desc: "Lower doses, slower ramp-up, prioritize safety",
                    },
                    {
                      id: "moderate" as const,
                      label: "Moderate",
                      desc: "Standard dosing protocols, balanced approach",
                    },
                    {
                      id: "aggressive" as const,
                      label: "Aggressive",
                      desc: "Higher doses, faster results, experienced users",
                    },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAggressiveness(opt.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                        aggressiveness === opt.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface hover:border-primary/40"
                      }`}
                    >
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs text-muted">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-danger/10 text-danger rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="flex-1 border border-border text-foreground font-semibold py-3 rounded-xl transition-colors hover:bg-surface-hover"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Finish Setup"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
