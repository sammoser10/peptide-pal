"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AIPeptideResult, Peptide } from "@/lib/database.types";

interface Props {
  existingPeptides: Peptide[];
  onComplete: () => void;
  onCancel: () => void;
}

interface ImportedPeptide extends AIPeptideResult {
  recent_doses?: { date: string; dose_mcg: number }[];
}

type DuplicateAction = "replace" | "keep" | null;

interface ImportItem {
  peptide: ImportedPeptide;
  existingMatch: Peptide | null;
  action: DuplicateAction;
}

export default function AIImportExisting({ existingPeptides, onComplete, onCancel }: Props) {
  const [bulkText, setBulkText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function findExistingMatch(name: string): Peptide | null {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return existingPeptides.find((p) => {
      const existingNormalized = p.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return existingNormalized === normalized ||
        existingNormalized.includes(normalized) ||
        normalized.includes(existingNormalized);
    }) || null;
  }

  async function handleParse() {
    if (!bulkText.trim()) return;
    setParsing(true);
    setError("");
    setImportItems([]);

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
        const items: ImportItem[] = data.peptides.map((p: ImportedPeptide) => {
          const match = findExistingMatch(p.name);
          return {
            peptide: p,
            existingMatch: match,
            action: match ? null : null, // null means needs decision if duplicate
          };
        });
        setImportItems(items);
      } else {
        setError("Could not identify any peptides in your text. Try including names, doses, and frequencies.");
      }
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setParsing(false);
    }
  }

  function setItemAction(index: number, action: DuplicateAction) {
    setImportItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, action } : item))
    );
  }

  const hasPendingDecisions = importItems.some(
    (item) => item.existingMatch && item.action === null
  );

  async function handleSaveAll() {
    setSaving(true);
    try {
      for (const item of importItems) {
        const { peptide, existingMatch, action } = item;

        if (existingMatch && action === "keep") {
          // Skip - keep existing
          continue;
        }

        if (existingMatch && action === "replace") {
          // Update existing peptide
          await apiFetch(`/api/peptides/${existingMatch.id}`, {
            method: "PUT",
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

          // Log recent doses under existing peptide
          if (peptide.recent_doses?.length) {
            for (const dose of peptide.recent_doses) {
              await apiFetch("/api/injections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  peptide_id: existingMatch.id,
                  dose_mcg: dose.dose_mcg,
                  injection_site: "Not specified",
                  injection_time: dose.date,
                  notes: "Imported from existing protocol",
                }),
              });
            }
          }
        } else {
          // New peptide - create it
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
        {importItems.length === 0 && !saved && (
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
        {importItems.length > 0 && !saved && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-sm font-semibold">Found {importItems.length} peptide{importItems.length > 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-2">
              {importItems.map((item, i) => (
                <div key={i} className="bg-surface-hover rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{item.peptide.name}</div>
                      <div className="text-xs text-muted mt-0.5">
                        {mcgToMg(item.peptide.default_dose_mcg)} mg &middot; {item.peptide.frequency_description}
                      </div>
                      {item.peptide.vial_size_mg && item.peptide.reconstitution_volume_ml && (
                        <div className="text-xs text-muted">
                          {item.peptide.vial_size_mg}mg vial + {item.peptide.reconstitution_volume_ml}mL water
                        </div>
                      )}
                      {item.peptide.recent_doses && item.peptide.recent_doses.length > 0 && (
                        <div className="text-xs text-primary mt-1">
                          + {item.peptide.recent_doses.length} dose{item.peptide.recent_doses.length > 1 ? "s" : ""} to import
                        </div>
                      )}
                    </div>
                    {!item.existingMatch && (
                      <span className="text-[11px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full shrink-0">
                        New
                      </span>
                    )}
                  </div>

                  {/* Duplicate handling */}
                  {item.existingMatch && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <div className="text-xs text-warning font-medium mb-2">
                        Already exists as &quot;{item.existingMatch.name}&quot;
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setItemAction(i, "replace")}
                          className={`flex-1 text-xs font-medium py-2 rounded-xl transition-all ${
                            item.action === "replace"
                              ? "bg-primary text-white"
                              : "bg-background border border-border text-foreground"
                          }`}
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => setItemAction(i, "keep")}
                          className={`flex-1 text-xs font-medium py-2 rounded-xl transition-all ${
                            item.action === "keep"
                              ? "bg-primary text-white"
                              : "bg-background border border-border text-foreground"
                          }`}
                        >
                          Keep Existing
                        </button>
                      </div>
                    </div>
                  )}

                  {item.peptide.notes && (
                    <div className="text-xs text-muted mt-1.5 italic">{item.peptide.notes}</div>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-danger/10 text-danger rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {hasPendingDecisions && (
              <p className="text-xs text-warning text-center font-medium">
                Choose Replace or Keep Existing for duplicates above
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setImportItems([]); setError(""); }}
                className="flex-1 bg-surface-hover text-foreground font-medium py-3 rounded-2xl"
              >
                Edit Text
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving || hasPendingDecisions}
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
