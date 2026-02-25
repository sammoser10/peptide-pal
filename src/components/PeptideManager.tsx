"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { formatDose } from "@/lib/units";
import type { Peptide, Blend, UserPreferences } from "@/lib/database.types";
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
  const [showArchived, setShowArchived] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDose, setEditDose] = useState("");
  const [editFrequency, setEditFrequency] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editVialSize, setEditVialSize] = useState("");
  const [editReconVolume, setEditReconVolume] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Blend state
  const [blends, setBlends] = useState<Blend[]>([]);
  const [currentPrefs, setCurrentPrefs] = useState<UserPreferences | null>(null);
  const [creatingBlend, setCreatingBlend] = useState(false);
  const [blendName, setBlendName] = useState("");
  const [blendPeptideIds, setBlendPeptideIds] = useState<string[]>([]);
  const [savingBlend, setSavingBlend] = useState(false);

  async function loadPeptides() {
    const [pepRes, profileRes] = await Promise.all([
      apiFetch("/api/peptides"),
      apiFetch("/api/profile"),
    ]);
    const pepData = await pepRes.json();
    const profileData = await profileRes.json();
    if (Array.isArray(pepData)) setPeptides(pepData);
    if (profileData?.preferences) {
      setCurrentPrefs(profileData.preferences);
      setBlends(profileData.preferences.blends || []);
    }
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

  function startEdit(p: Peptide) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDose(String(p.default_dose_mcg));
    setEditFrequency(p.frequency_description || "");
    setEditNotes(p.notes || "");
    setEditVialSize(p.vial_size_mg ? String(p.vial_size_mg) : "");
    setEditReconVolume(p.reconstitution_volume_ml ? String(p.reconstitution_volume_ml) : "");
  }

  async function handleEditSave() {
    if (!editingId) return;
    setEditLoading(true);
    try {
      const res = await apiFetch(`/api/peptides/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          default_dose_mcg: parseFloat(editDose),
          frequency_description: editFrequency,
          notes: editNotes || null,
          vial_size_mg: editVialSize ? parseFloat(editVialSize) : null,
          reconstitution_volume_ml: editReconVolume ? parseFloat(editReconVolume) : null,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        loadPeptides();
      }
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/peptides/${id}`, { method: "DELETE" });
    setDeletingId(null);
    loadPeptides();
  }

  async function handleArchive(id: string, archived: boolean) {
    await apiFetch(`/api/peptides/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    loadPeptides();
  }

  async function saveBlends(updated: Blend[]) {
    setSavingBlend(true);
    try {
      const newPrefs = { ...(currentPrefs || {}), blends: updated };
      const profileRes = await apiFetch("/api/profile");
      const profile = await profileRes.json();
      await apiFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syringe_size_ml: profile?.syringe_size_ml ?? 0.5,
          onboarding_completed: profile?.onboarding_completed ?? true,
          preferences: newPrefs,
        }),
      });
      setCurrentPrefs(newPrefs);
      setBlends(updated);
    } finally {
      setSavingBlend(false);
    }
  }

  function handleCreateBlend() {
    if (!blendName.trim() || blendPeptideIds.length < 2) return;
    const newBlend: Blend = {
      id: crypto.randomUUID(),
      name: blendName.trim(),
      peptide_ids: blendPeptideIds,
    };
    saveBlends([...blends, newBlend]);
    setBlendName("");
    setBlendPeptideIds([]);
    setCreatingBlend(false);
  }

  function handleDeleteBlend(id: string) {
    saveBlends(blends.filter((b) => b.id !== id));
  }

  function toggleBlendPeptide(id: string) {
    setBlendPeptideIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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

  const activePeptides = peptides.filter((p) => !p.archived);
  const archivedPeptides = peptides.filter((p) => p.archived);

  function renderPeptideCard(p: Peptide) {
    const isEditing = editingId === p.id;
    const isDeleting = deletingId === p.id;
    const isArchived = p.archived;

    if (isEditing) {
      return (
        <div key={p.id} className="bg-surface rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px]">Edit Protocol</h3>
            <button
              onClick={() => setEditingId(null)}
              className="text-sm text-primary font-medium"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Peptide name"
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              value={editDose}
              onChange={(e) => setEditDose(e.target.value)}
              placeholder="Dose (mcg)"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
            />
            <input
              type="text"
              value={editFrequency}
              onChange={(e) => setEditFrequency(e.target.value)}
              placeholder="Frequency"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              value={editVialSize}
              onChange={(e) => setEditVialSize(e.target.value)}
              placeholder="Vial (mg)"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
            />
            <input
              type="number"
              step="any"
              value={editReconVolume}
              onChange={(e) => setEditReconVolume(e.target.value)}
              placeholder="Water (mL)"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
            />
          </div>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={2}
            placeholder="Notes..."
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm resize-none"
          />
          <button
            onClick={handleEditSave}
            disabled={editLoading || !editName || !editDose}
            className="w-full bg-primary text-white font-semibold py-3 rounded-2xl disabled:opacity-50 press-spring"
          >
            {editLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      );
    }

    return (
      <div
        key={p.id}
        className={`bg-surface rounded-2xl p-4 shadow-sm ${isArchived ? "opacity-60" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px]">{p.name}</div>
            <div className="text-sm text-muted mt-1">
              {formatDose(p.default_dose_mcg, p.vial_size_mg, p.reconstitution_volume_ml)}
            </div>
            {p.frequency_description && (
              <div className="text-sm text-muted">{p.frequency_description}</div>
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
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => startEdit(p)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-primary/8 transition-colors"
              title="Edit"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => handleArchive(p.id, !isArchived)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-warning hover:bg-warning/8 transition-colors"
              title={isArchived ? "Restore" : "Archive"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isArchived ? (
                  <>
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </>
                ) : (
                  <>
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </>
                )}
              </svg>
            </button>
            <button
              onClick={() => setDeletingId(p.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-danger/8 transition-colors"
              title="Delete"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {isDeleting && (
          <div className="mt-3 pt-3 border-t border-border/50 animate-expand">
            <p className="text-sm text-danger font-medium mb-2">Delete {p.name}?</p>
            <p className="text-xs text-muted mb-3">This will permanently remove this protocol. Injection history will be preserved.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 text-sm font-medium py-2 rounded-xl bg-surface-hover"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                className="flex-1 text-sm font-semibold py-2 rounded-xl bg-danger text-white"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Active protocols */}
      {activePeptides.length === 0 && addMode === null && (
        <p className="text-muted text-sm text-center py-6">
          No active peptides in your protocol. Add your first one below.
        </p>
      )}

      {activePeptides.map(renderPeptideCard)}

      {/* Blends section */}
      {(blends.length > 0 || activePeptides.length >= 2) && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="font-semibold text-xs text-muted uppercase tracking-wider">
              Blends {blends.length > 0 && `(${blends.length})`}
            </h3>
          </div>

          {blends.map((blend) => {
            const blendPeps = blend.peptide_ids
              .map((id) => peptides.find((p) => p.id === id))
              .filter(Boolean) as Peptide[];

            return (
              <div key={blend.id} className="bg-surface rounded-2xl p-4 shadow-sm mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]">{blend.name}</div>
                    <div className="text-sm text-muted mt-0.5">
                      {blendPeps.map((p) => p.name).join(" + ")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBlend(blend.id)}
                    disabled={savingBlend}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-danger hover:bg-danger/8 transition-colors"
                    title="Delete blend"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {creatingBlend ? (
            <div className="bg-surface rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[15px]">Create Blend</h3>
                <button
                  onClick={() => { setCreatingBlend(false); setBlendName(""); setBlendPeptideIds([]); }}
                  className="text-sm text-primary font-medium"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                value={blendName}
                onChange={(e) => setBlendName(e.target.value)}
                placeholder="Blend name (e.g. Glow Blend)"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                autoFocus
              />
              <div>
                <p className="text-sm font-medium mb-2">Select peptides (min 2)</p>
                <div className="space-y-1.5">
                  {activePeptides.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        blendPeptideIds.includes(p.id)
                          ? "bg-primary/8 border border-primary/20"
                          : "bg-surface-hover border border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={blendPeptideIds.includes(p.id)}
                        onChange={() => toggleBlendPeptide(p.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        blendPeptideIds.includes(p.id)
                          ? "bg-primary border-primary"
                          : "border-border"
                      }`}>
                        {blendPeptideIds.includes(p.id) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreateBlend}
                disabled={savingBlend || !blendName.trim() || blendPeptideIds.length < 2}
                className="w-full bg-primary text-white font-semibold py-3 rounded-2xl disabled:opacity-50 press-spring"
              >
                {savingBlend ? "Saving..." : "Create Blend"}
              </button>
            </div>
          ) : activePeptides.length >= 2 && (
            <button
              onClick={() => setCreatingBlend(true)}
              className="w-full bg-surface border-2 border-dashed border-border rounded-2xl py-3 text-muted font-medium text-sm press-spring"
            >
              + Create Blend
            </button>
          )}
        </div>
      )}

      {/* Mode selection */}
      {addMode === "choose" && (
        <div className="bg-surface rounded-2xl p-5 shadow-sm space-y-3 animate-slide-up">
          <h3 className="font-semibold text-[15px] text-center">Add to Protocol</h3>

          <button
            onClick={() => setAddMode("ai-new")}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-primary/6 border border-primary/15 press-spring text-left"
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

          <button
            onClick={() => setAddMode("ai-existing")}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-surface-hover border border-border press-spring text-left"
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

          <button
            onClick={() => setAddMode("manual")}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-surface-hover border border-border press-spring text-left"
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
          onComplete={() => { resetForm(); loadPeptides(); }}
          onCancel={() => setAddMode(null)}
        />
      )}

      {/* AI import existing protocol flow */}
      {addMode === "ai-existing" && (
        <AIImportExisting
          existingPeptides={peptides}
          onComplete={() => { resetForm(); loadPeptides(); }}
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
            <label className="block text-sm font-medium mb-1">Peptide Name</label>
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
            <label className="block text-sm font-medium mb-1">Default Dose (mcg)</label>
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
              Reconstitution Info <span className="text-muted font-normal">(optional)</span>
            </p>
            <p className="text-xs text-muted mb-3">Add this to see your dose in syringe units.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Vial Size (mg)</label>
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
                <label className="block text-xs font-medium mb-1">Water Added (mL)</label>
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
                {formatDose(parseFloat(dose), parseFloat(vialSize), parseFloat(reconVolume))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
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
              className="flex-1 bg-primary text-white font-semibold py-3 rounded-2xl disabled:opacity-50 press-spring"
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
          className="w-full bg-surface border-2 border-dashed border-border rounded-2xl py-4 text-muted font-medium press-spring"
        >
          + Add to Protocol
        </button>
      )}

      {/* Archived section */}
      {archivedPeptides.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
            </svg>
            Archived ({archivedPeptides.length})
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showArchived ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showArchived && (
            <div className="mt-3 space-y-3">
              {archivedPeptides.map(renderPeptideCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
