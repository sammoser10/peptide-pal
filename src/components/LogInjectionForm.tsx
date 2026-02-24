"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import type { Peptide, InjectionWithPeptide } from "@/lib/database.types";
import DualDoseInput from "./DualDoseInput";
import BodyMap, { ALL_INJECTION_SITES } from "./BodyMap";
import type { InjectionSiteInfo } from "./BodyMap";

interface LogInjectionFormProps {
  onSuccess: () => void;
}

function getRecommendedSite(recentSites: InjectionSiteInfo[], availableSites?: string[]): string | undefined {
  const sites = availableSites
    ? ALL_INJECTION_SITES.filter((s) => availableSites.includes(s.id))
    : ALL_INJECTION_SITES;

  if (sites.length === 0) return undefined;

  // Find the site that was used least recently (or never)
  let bestSite = sites[0].id;
  let bestDaysAgo = -1;

  for (const site of sites) {
    const recent = recentSites.find((r) => r.site === site.id);
    if (!recent?.lastUsed) {
      // Never used - strongly recommend
      return site.id;
    }
    const days = Math.floor(
      (Date.now() - new Date(recent.lastUsed).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days > bestDaysAgo) {
      bestDaysAgo = days;
      bestSite = site.id;
    }
  }

  return bestSite;
}

export default function LogInjectionForm({ onSuccess }: LogInjectionFormProps) {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [peptideId, setPeptideId] = useState("");
  const [doseMcg, setDoseMcg] = useState("");
  const [injectionSite, setInjectionSite] = useState("");
  const [injectionTime, setInjectionTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentInjections, setRecentInjections] = useState<InjectionWithPeptide[]>([]);
  const [preferredSites, setPreferredSites] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/peptides").then((r) => r.json()),
      apiFetch("/api/injections?limit=50").then((r) => r.json()),
      apiFetch("/api/profile").then((r) => r.json()),
    ]).then(([pepData, injData, profileData]) => {
      if (Array.isArray(pepData)) setPeptides(pepData);
      if (Array.isArray(injData)) setRecentInjections(injData);
      if (profileData?.preferences?.preferred_sites?.length) {
        setPreferredSites(profileData.preferences.preferred_sites);
      }
    });

    // Default to current local time
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000);
    setInjectionTime(local.toISOString().slice(0, 16));
  }, []);

  // Auto-fill dose when peptide is selected
  useEffect(() => {
    const selected = peptides.find((p) => p.id === peptideId);
    if (selected) {
      setDoseMcg(String(selected.default_dose_mcg));
    }
  }, [peptideId, peptides]);

  const selectedPeptide = peptides.find((p) => p.id === peptideId);

  // Compute recent site usage
  const recentSiteInfo = useMemo<InjectionSiteInfo[]>(() => {
    const siteMap = new Map<string, { lastUsed: string; count: number }>();
    for (const inj of recentInjections) {
      const existing = siteMap.get(inj.injection_site);
      if (!existing || inj.injection_time > existing.lastUsed) {
        siteMap.set(inj.injection_site, {
          lastUsed: inj.injection_time,
          count: (existing?.count || 0) + 1,
        });
      } else {
        existing.count++;
      }
    }
    return Array.from(siteMap.entries()).map(([site, info]) => ({
      site,
      lastUsed: info.lastUsed,
      count: info.count,
    }));
  }, [recentInjections]);

  const recommendedSite = useMemo(
    () => getRecommendedSite(recentSiteInfo, preferredSites),
    [recentSiteInfo, preferredSites]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/injections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peptide_id: peptideId,
          dose_mcg: parseFloat(doseMcg),
          injection_site: injectionSite,
          injection_time: new Date(injectionTime).toISOString(),
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log injection");
      }

      // Reset form
      setDoseMcg("");
      setInjectionSite("");
      setNotes("");
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const local = new Date(now.getTime() - offset * 60000);
      setInjectionTime(local.toISOString().slice(0, 16));

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-danger/10 text-danger rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {peptides.length === 0 ? (
        <p className="text-muted text-sm text-center py-4">
          No peptides added yet. Add one in the Peptides tab first.
        </p>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Peptide</label>
            <select
              value={peptideId}
              onChange={(e) => setPeptideId(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-foreground"
            >
              <option value="">Select peptide...</option>
              {peptides.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <DualDoseInput
            doseMcg={doseMcg}
            onDoseMcgChange={setDoseMcg}
            vialSizeMg={selectedPeptide?.vial_size_mg ?? null}
            reconstitutionVolumeMl={selectedPeptide?.reconstitution_volume_ml ?? null}
          />

          <BodyMap
            selected={injectionSite}
            onSelect={setInjectionSite}
            recentSites={recentSiteInfo}
            recommendedSite={recommendedSite}
            availableSites={preferredSites}
          />

          <div>
            <label className="block text-sm font-medium mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={injectionTime}
              onChange={(e) => setInjectionTime(e.target.value)}
              required
              className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any observations..."
              className="w-full bg-surface border border-border rounded-lg px-3 py-3 text-foreground resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !peptideId || !injectionSite}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging..." : "Log Injection"}
          </button>
        </>
      )}
    </form>
  );
}
