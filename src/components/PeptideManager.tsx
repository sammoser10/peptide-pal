"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { formatDose } from "@/lib/units";
import type { Peptide } from "@/lib/database.types";
import AIAddPeptide from "./AIAddPeptide";
import AIImportExisting from "./AIImportExisting";

type AddMode = null | "choose" | "manual" | "ai-new" | "ai-existing";

export default function PeptideManager() {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");
  const [vialSize, setVialSize] = useState("");
  const [reconVolume, setReconVolume] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadPeptides() {
    const res = await apiFetch("/api/peptides");
    const data = await res.json();
    if (Array.isArray(data)) setPeptides(data);
  }

  useEffect(() => {
    loadPeptides();
  }, []);

  function resetForm() {
    setName("");
    setDose("");
    setFrequency("");
    setNotes("");
    setVialSize("");
    setReconVolume("");
    setAddMode(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/peptides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          default_dose_mcg: parseFloat(dose),
          frequency_description: frequency,
          notes: notes || null,
          vial_size_mg: vialSize ? parseFloat(vialSize) : null,
          reconstitution_volume_ml: reconVolume
            ? parseFloat(reconVolume)
            : null,
        }),
      });
      if (res.ok) {
        resetForm();
        loadPeptides();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {peptides.length === 0 && addMode === null && (
        <p className="text-muted text-sm text-center py-6">
          No peptides in your protocol yet. Add your first one below.
        </p>
      )}

      {peptides.map((p) => (
        <div
          key={p.id}
          className="bg-surface rounded-2xl p-4 shadow-sm"
        >
          <div className="font-semibold text-[15px]">{p.name}</div>
          <div className="text-sm text-muted mt-1">
            {formatDose(
              p.default_dose_mcg,
              p.vial_size_mg,
              p.reconstitution_volume_ml
            )}
          </div>
          {p.frequency_description && (
            <div className="text-sm text-muted">
              {p.frequency_description}
            </div>
          )}
          {p.vial_size_mg && p.reconstitution_volume_ml && (
            <div className="text-xs text-muted mt-1">
              {p.vial_size_mg}mg vial + {p.reconstitution_volume_ml}mL BAC water
            </div>
          )}
          {p.notes && (
            <div className="text-sm text-muted mt-1.5 italic">{p.notes}</div>
          )}
        </div>
      ))}

      {/* Mode selection */}
      {addMode === "choose" && (
        <div className="bg-surface rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-[15px] text-center">Add to Protocol</h3>

          {/* Add New with AI */}
          <button
            onClick={() => setAddMode("ai-new")}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-primary/6 border border-primary/15 active:scale-[0.98] transition-transform text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                <path d="M9 21h6" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm text-primary">Add New with AI</div>
              <div className="text-xs text-muted mt-0.5">AI helps you configure a new peptide</div>
            </div>
          </button>

          {/* Import Existing with AI */}
          <button
            onClick={() => setAddMode("ai-existing")}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-surface-hover border border-border active:scale-[0.98] transition-transform text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm">Import Existing with AI</div>
              <div className="text-xs text-muted mt-0.5">Paste your current protocol and AI imports it</div>
            </div>
          </button>

          {/* Manual */}
          <button
            onClick={() => setAddMode("manual")}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-surface-hover border border-border active:scale-[0.98] transition-transform text-left"
          >
            <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm">Add Manually</div>
              <div className="text-xs text-muted mt-0.5">Fill in the details yourself</div>
            </div>
          </button>

          <button
            onClick={() => setAddMode(null)}
            className="w-full text-sm text-muted py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* AI-assisted new peptide flow */}
      {addMode === "ai-new" && (
        <AIAddPeptide
          onComplete={() => {
            resetForm();
            loadPeptides();
          }}
          onCancel={() => setAddMode(null)}
        />
      )}

      {/* AI import existing protocol flow */}
      {addMode === "ai-existing" && (
        <AIImportExisting
          onComplete={() => {
            resetForm();
            loadPeptides();
          }}
          onCancel={() => setAddMode(null)}
        />
      )}

      {/* Manual form */}
      {addMode === "manual" && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-2xl p-4 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-[15px]">Add Manually</h3>
            <button
              type="button"
              onClick={() => setAddMode("choose")}
              className="text-xs text-primary font-medium"
            >
              Switch to AI
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Peptide Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. BPC-157"
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Default Dose (mcg)
            </label>
            <input
              type="number"
              step="any"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              required
              placeholder="e.g. 250"
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Frequency</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="e.g. Once daily, Twice weekly"
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground"
            />
          </div>

          <div className="border-t border-border/50 pt-3 mt-3">
            <p className="text-sm font-medium mb-2">
              Reconstitution Info{" "}
              <span className="text-muted font-normal">(optional)</span>
            </p>
            <p className="text-xs text-muted mb-3">
              Add this to see your dose in syringe units.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Vial Size (mg)
                </label>
                <input
                  type="number"
                  step="any"
                  value={vialSize}
                  onChange={(e) => setVialSize(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Water Added (mL)
                </label>
                <input
                  type="number"
                  step="any"
                  value={reconVolume}
                  onChange={(e) => setReconVolume(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground"
                />
              </div>
            </div>
            {vialSize && reconVolume && dose && (
              <div className="mt-2 p-2.5 bg-primary/8 rounded-xl text-sm text-primary font-medium">
                {formatDose(
                  parseFloat(dose),
                  parseFloat(vialSize),
                  parseFloat(reconVolume)
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any details about this peptide..."
              className="w-full bg-background border border-border rounded-xl px-3 py-3 text-foreground resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAddMode(null)}
              className="flex-1 bg-surface-hover text-foreground font-medium py-3 rounded-2xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white font-semibold py-3 rounded-2xl disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {loading ? "Adding..." : "Add Peptide"}
            </button>
          </div>
        </form>
      )}

      {/* Add button */}
      {addMode === null && (
        <button
          onClick={() => setAddMode("choose")}
          className="w-full bg-surface border-2 border-dashed border-border rounded-2xl py-4 text-muted font-medium active:scale-[0.98] transition-transform"
        >
          + Add to Protocol
        </button>
      )}
    </div>
  );
}
