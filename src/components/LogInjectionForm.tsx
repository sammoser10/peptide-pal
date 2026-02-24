"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Peptide } from "@/lib/database.types";
import DualDoseInput from "./DualDoseInput";
import BodyMap from "./BodyMap";

interface LogInjectionFormProps {
  onSuccess: () => void;
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

  useEffect(() => {
    apiFetch("/api/peptides")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPeptides(data);
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
