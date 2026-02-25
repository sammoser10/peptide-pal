"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import type { UserPreferences } from "@/lib/database.types";
import { ALL_INJECTION_SITES } from "./BodyMap";

const SYRINGE_OPTIONS = [
  { size: 0.3, label: "0.3 mL (30 units)" },
  { size: 0.5, label: "0.5 mL (50 units)" },
  { size: 1.0, label: "1 mL (100 units)" },
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

export default function SettingsView() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile fields
  const [syringeSize, setSyringeSize] = useState(0.5);

  // Preferences
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [aggressiveness, setAggressiveness] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [preferredSites, setPreferredSites] = useState<string[]>(
    ALL_INJECTION_SITES.map((s) => s.id)
  );

  const loadSettings = useCallback(() => {
    if (!profile) return;
    setSyringeSize(profile.syringe_size_ml || 0.5);

    const prefs = profile.preferences;
    if (prefs) {
      setSex(prefs.sex || "");
      setAge(prefs.age ? String(prefs.age) : "");
      setHeightCm(prefs.height_cm ? String(prefs.height_cm) : "");
      setWeightKg(prefs.weight_kg ? String(prefs.weight_kg) : "");
      setBodyFatPct(prefs.body_fat_pct ? String(prefs.body_fat_pct) : "");
      setGoals(prefs.goals || []);
      setExperience(prefs.experience_level || "beginner");
      setAggressiveness(prefs.aggressiveness || "moderate");
      if (prefs.preferred_sites?.length) {
        setPreferredSites(prefs.preferred_sites);
      }
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const preferences: UserPreferences = {
        ...(profile?.preferences || {}),
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

      await apiFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syringe_size_ml: syringeSize,
          onboarding_completed: true,
          preferences,
        }),
      });

      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const siteGroups = [
    { label: "Upper Body", sites: ALL_INJECTION_SITES.filter((s) => s.group === "Upper") },
    { label: "Core", sites: ALL_INJECTION_SITES.filter((s) => s.group === "Core") },
    { label: "Lower Body", sites: ALL_INJECTION_SITES.filter((s) => s.group === "Lower") },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Success banner */}
      {saved && (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-3 flex items-center gap-2 animate-fade-in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-sm font-medium text-success">Settings saved</span>
        </div>
      )}

      {/* Syringe Size */}
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">Syringe</h3>
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          {SYRINGE_OPTIONS.map((opt, idx) => (
            <button
              key={opt.size}
              onClick={() => setSyringeSize(opt.size)}
              className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors ${
                idx > 0 ? "border-t border-border/40" : ""
              } ${syringeSize === opt.size ? "bg-primary/5" : ""}`}
            >
              <span className="text-[15px]">{opt.label}</span>
              {syringeSize === opt.size && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Body Composition */}
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">About You</h3>
        <div className="bg-surface rounded-2xl shadow-sm p-4 space-y-4">
          {/* Sex */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Sex</label>
            <div className="grid grid-cols-3 gap-2">
              {(["male", "female", "other"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors capitalize ${
                    sex === s
                      ? "bg-primary text-white"
                      : "bg-surface-hover text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="30"
              className="w-full bg-surface-hover rounded-xl px-3.5 py-2.5 text-foreground"
            />
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Height (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="175"
                className="w-full bg-surface-hover rounded-xl px-3.5 py-2.5 text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="80"
                className="w-full bg-surface-hover rounded-xl px-3.5 py-2.5 text-foreground"
              />
            </div>
          </div>

          {/* Body fat */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Body Fat %</label>
            <input
              type="number"
              value={bodyFatPct}
              onChange={(e) => setBodyFatPct(e.target.value)}
              placeholder="15"
              className="w-full bg-surface-hover rounded-xl px-3.5 py-2.5 text-foreground"
            />
          </div>
        </div>
      </section>

      {/* Goals */}
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">Goals</h3>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = goals.includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(goal.id)}
                className={`flex items-center gap-2 p-3 rounded-2xl transition-all text-left ${
                  isSelected
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-surface border-2 border-transparent shadow-sm"
                }`}
              >
                <span className="text-lg">{goal.icon}</span>
                <span className="text-sm font-medium">{goal.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Experience & Approach */}
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">Approach</h3>
        <div className="bg-surface rounded-2xl shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Peptide Experience</label>
            <div className="space-y-2">
              {([
                { id: "beginner" as const, label: "Beginner", desc: "New to peptides" },
                { id: "intermediate" as const, label: "Intermediate", desc: "Used peptides before" },
                { id: "advanced" as const, label: "Advanced", desc: "Multiple cycles completed" },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExperience(opt.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    experience === opt.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-surface-hover border-2 border-transparent"
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Aggressiveness</label>
            <div className="space-y-2">
              {([
                { id: "conservative" as const, label: "Conservative", desc: "Lower doses, prioritize safety" },
                { id: "moderate" as const, label: "Moderate", desc: "Standard dosing, balanced approach" },
                { id: "aggressive" as const, label: "Aggressive", desc: "Higher doses, faster results" },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAggressiveness(opt.id)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    aggressiveness === opt.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-surface-hover border-2 border-transparent"
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Injection Sites */}
      <section>
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">Injection Sites</h3>
        <div className="bg-surface rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-xs text-muted">Select sites you use for rotation.</p>
          {siteGroups.map((group) => (
            <div key={group.label}>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                {group.label}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {group.sites.map((site) => {
                  const isSelected = preferredSites.includes(site.id);
                  return (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => toggleSite(site.id)}
                      className={`px-3 py-2 rounded-xl text-sm text-left transition-all ${
                        isSelected
                          ? "bg-primary/10 border-2 border-primary font-medium"
                          : "bg-surface-hover border-2 border-transparent text-muted"
                      }`}
                    >
                      {site.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {preferredSites.length < 2 && (
            <p className="text-xs text-warning">Select at least 2 sites for proper rotation.</p>
          )}
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || preferredSites.length < 2}
        className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
