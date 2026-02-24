"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AIPeptideResult } from "@/lib/database.types";

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

interface ImportedPeptide extends AIPeptideResult {
  recent_doses?: { date: string; dose_mcg: number }[];
}

export default function AIImportExisting({ onComplete, onCancel }: Props) {
  const [bulkText, setBulkText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [results, setResults] = useState<ImportedPeptide[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleParse() {
    if (!bulkText.trim()) return;
    setParsing(true);
    setError("");
    setResults([]);

    try {
      const res = await apiFetch("/api/ai-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: bulkText }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to parse your protocol");
        return;
      }

      const data = await res.json();
      if (data.peptides && data.peptides.length > 0) {
        setResults(data.peptides);
      } else {
        setError("Could not identify any peptides in your text. Try including names, doses, and frequencies.");
      }
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setParsing(false);
    }
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      for (const peptide of results) {
        const res = await apiFetch("/api/peptides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: peptide.name,
            default_dose_mcg: peptide.default_dose_mcg,
            frequency_description: peptide.frequency_description,
            notes: peptide.notes,
            vial_size_mg: peptide.vial_size_mg,
            reconstitution_volume_ml: peptide.reconstitution_volume_ml,
          }),
        });

        // Log any recent doses if provided
        if (res.ok && peptide.recent_doses?.length) {
          const savedPeptide = await res.json();
          for (const dose of peptide.recent_doses) {
            await apiFetch("/api/injections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                peptide_id: savedPeptide.id,
                dose_mcg: dose.dose_mcg,
                injection_site: "Not specified",
                injection_time: dose.date,
                notes: "Imported from existing protocol",
              }),
            });
          }
        }
      }
      setSaved(true);
      setTimeout(() => onComplete(), 1000);
    } catch {
      setError("Failed to save some peptides");
    } finally {
      setSaving(false);
    }
  }

  function mcgToMg(mcg: number): string {
    return String(Math.round((mcg / 1000) * 10000) / 10000);
  }

  return (
    <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-[15px]">Import Existing Protocol</h3>
        <button onClick={onCancel} className="text-primary text-sm font-medium">
          Cancel
        </button>
      </div>

      <div className="p-4 space-y-4">
        {!results.length && !saved && (
          <>
            <p className="text-sm text-muted">
              Paste details about your current peptide protocol. Include peptide names, doses, frequencies, and any history you want to track.
            </p>

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              placeholder={"Example:\nI currently take Retatrutide 4mg once a week, started at 1mg 3 weeks ago. Also taking BPC-157 500mcg twice daily for the last 2 weeks with a 10mg vial reconstituted in 2ml BAC water."}
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground text-sm resize-none"
              autoFocus
            />

            {error && (
              <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={parsing || !bulkText.trim()}
              className="w-full bg-primary text-white font-semibold py-3 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {parsing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Analyzing...</span>
                </>
              ) : (
                "Analyze with AI"
              )}
            </button>
          </>
        )}

        {/* Results preview */}
        {results.length > 0 && !saved && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-sm font-semibold">Found {results.length} peptide{results.length > 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-2">
              {results.map((p, i) => (
                <div key={i} className="bg-surface-hover rounded-xl p-3">
                  <div className="font-semibold text-sm">{p.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {mcgToMg(p.default_dose_mcg)} mg &middot; {p.frequency_description}
                  </div>
                  {p.vial_size_mg && p.reconstitution_volume_ml && (
                    <div className="text-xs text-muted">
                      {p.vial_size_mg}mg vial + {p.reconstitution_volume_ml}mL water
                    </div>
                  )}
                  {p.recent_doses && p.recent_doses.length > 0 && (
                    <div className="text-xs text-primary mt-1">
                      + {p.recent_doses.length} dose{p.recent_doses.length > 1 ? "s" : ""} to import
                    </div>
                  )}
                  {p.notes && (
                    <div className="text-xs text-muted mt-1 italic">{p.notes}</div>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setResults([]); setError(""); }}
                className="flex-1 bg-surface-hover text-foreground font-medium py-3 rounded-2xl"
              >
                Edit Text
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex-1 bg-primary text-white font-semibold py-3 rounded-2xl disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                {saving ? "Importing..." : "Import All"}
              </button>
            </div>
          </>
        )}

        {/* Success */}
        {saved && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="font-semibold">Protocol Imported</p>
            <p className="text-sm text-muted mt-1">Your peptides and history have been added.</p>
          </div>
        )}
      </div>
    </div>
  );
}
