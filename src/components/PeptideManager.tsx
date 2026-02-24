"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { formatDose } from "@/lib/units";
import type { Peptide } from "@/lib/database.types";

export default function PeptideManager() {
  const [peptides, setPeptides] = useState<Peptide[]>([]);
  const [showForm, setShowForm] = useState(false);
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
        setName("");
        setDose("");
        setFrequency("");
        setNotes("");
        setVialSize("");
        setReconVolume("");
        setShowForm(false);
        loadPeptides();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {peptides.length === 0 && !showForm && (
        <p className="text-muted text-sm text-center py-4">
          No peptides added yet. Tap the button below to add your first one.
        </p>
      )}

      {peptides.map((p) => (
        <div
          key={p.id}
          className="bg-surface border border-border rounded-xl p-4"
        >
          <div className="font-semibold text-lg">{p.name}</div>
          <div className="text-sm text-muted mt-1">
            Default dose:{" "}
            {formatDose(
              p.default_dose_mcg,
              p.vial_size_mg,
              p.reconstitution_volume_ml
            )}
          </div>
          {p.frequency_description && (
            <div className="text-sm text-muted">
              Frequency: {p.frequency_description}
            </div>
          )}
          {p.vial_size_mg && p.reconstitution_volume_ml && (
            <div className="text-sm text-muted">
              Reconstitution: {p.vial_size_mg}mg vial + {p.reconstitution_volume_ml}mL water
            </div>
          )}
          {p.notes && (
            <div className="text-sm text-muted mt-1 italic">{p.notes}</div>
          )}
        </div>
      ))}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-xl p-4 space-y-3"
        >
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
              className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground"
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
              className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Frequency</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="e.g. Once daily, Twice weekly"
              className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground"
            />
          </div>

          {/* Reconstitution section */}
          <div className="border-t border-border pt-3 mt-3">
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
                  className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground"
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
                  className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground"
                />
              </div>
            </div>
            {vialSize && reconVolume && dose && (
              <div className="mt-2 p-2 bg-primary/10 rounded-lg text-sm text-primary">
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
              className="w-full bg-background border border-border rounded-lg px-3 py-3 text-foreground resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-surface-hover text-foreground font-medium py-3 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Peptide"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-border rounded-xl py-4 text-muted font-medium hover:border-primary hover:text-primary transition-colors"
        >
          + Add Peptide
        </button>
      )}
    </div>
  );
}
