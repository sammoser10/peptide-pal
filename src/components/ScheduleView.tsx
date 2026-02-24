"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { ScheduleEntryWithPeptide } from "@/lib/database.types";

interface ScheduleViewProps {
  refreshKey: number;
  onDoseLogged?: () => void;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_ORDER = { morning: 0, afternoon: 1, evening: 2 };
const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const INJECTION_SITES = [
  "Left deltoid",
  "Right deltoid",
  "Left abdomen",
  "Right abdomen",
  "Left love handle",
  "Right love handle",
  "Left thigh",
  "Right thigh",
  "Left glute",
  "Right glute",
];

function mcgToMg(mcg: number): string {
  return String(Math.round((mcg / 1000) * 10000) / 10000);
}

export default function ScheduleView({ refreshKey, onDoseLogged }: ScheduleViewProps) {
  const [schedule, setSchedule] = useState<ScheduleEntryWithPeptide[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [showTips, setShowTips] = useState(false);

  // Take dose state
  const [takingDoseId, setTakingDoseId] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState("");
  const [loggingDose, setLoggingDose] = useState(false);
  const [doseSuccess, setDoseSuccess] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/schedule");
      const data = await res.json();
      if (Array.isArray(data)) setSchedule(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [refreshKey, loadSchedule]);

  // Auto-clear success message
  useEffect(() => {
    if (doseSuccess) {
      const t = setTimeout(() => setDoseSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [doseSuccess]);

  async function generateSchedule() {
    setGenerating(true);
    setError("");
    try {
      const recRes = await apiFetch("/api/recommendations");
      const recData = await recRes.json();

      if (recData.error) {
        setError(recData.error);
        return;
      }

      if (!recData.schedule || recData.schedule.length === 0) {
        setError(
          recData.summary ||
            "AI could not generate a schedule. Make sure you have peptides added."
        );
        return;
      }

      const saveRes = await apiFetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: recData.schedule }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        setError(err.error || "Failed to save schedule");
        return;
      }

      setSummary(recData.summary || "");
      setTips(recData.tips || []);
      await loadSchedule();
    } catch {
      setError("Failed to connect to AI service");
    } finally {
      setGenerating(false);
    }
  }

  async function clearSchedule() {
    try {
      await apiFetch("/api/schedule", { method: "DELETE" });
      setSchedule([]);
      setSummary("");
      setTips([]);
    } catch {
      setError("Failed to clear schedule");
    }
  }

  async function handleTakeDose(entry: ScheduleEntryWithPeptide) {
    if (!selectedSite) return;
    setLoggingDose(true);
    try {
      const res = await apiFetch("/api/injections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peptide_id: entry.peptide_id,
          dose_mcg: entry.dose_mcg,
          injection_site: selectedSite,
          injection_time: new Date().toISOString(),
          notes: `Logged from schedule (${TIME_LABELS[entry.time_of_day]})`,
        }),
      });

      if (res.ok) {
        setDoseSuccess(entry.peptides?.name || "Dose");
        setTakingDoseId(null);
        setSelectedSite("");
        onDoseLogged?.();
      }
    } finally {
      setLoggingDose(false);
    }
  }

  // Group by day
  const byDay: Record<number, ScheduleEntryWithPeptide[]> = {};
  for (const entry of schedule) {
    if (!byDay[entry.day_of_week]) byDay[entry.day_of_week] = [];
    byDay[entry.day_of_week].push(entry);
  }

  for (const day in byDay) {
    byDay[day].sort(
      (a, b) =>
        TIME_ORDER[a.time_of_day as keyof typeof TIME_ORDER] -
        TIME_ORDER[b.time_of_day as keyof typeof TIME_ORDER]
    );
  }

  const today = new Date().getDay();

  function getNextDoseInfo(): { dayLabel: string; entry: ScheduleEntryWithPeptide } | null {
    if (schedule.length === 0) return null;
    for (let offset = 0; offset < 7; offset++) {
      const day = (today + offset) % 7;
      const entries = byDay[day];
      if (entries && entries.length > 0) {
        const dayLabel = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : DAY_NAMES[day];
        return { dayLabel, entry: entries[0] };
      }
    }
    return null;
  }

  const nextDose = getNextDoseInfo();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success toast */}
      {doseSuccess && (
        <div className="bg-success/10 border border-success/20 rounded-2xl p-3 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-success shrink-0" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-sm font-medium text-success">{doseSuccess} logged</span>
        </div>
      )}

      {/* Next dose card */}
      {nextDose && (
        <div className="bg-primary/8 rounded-2xl p-4">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            Next Dose &middot; {nextDose.dayLabel}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-primary" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-[15px]">
                  {nextDose.entry.peptides?.name || "Unknown"}
                </div>
                <div className="text-sm text-muted">
                  {mcgToMg(nextDose.entry.dose_mcg)} mg &middot;{" "}
                  {TIME_LABELS[nextDose.entry.time_of_day]}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setTakingDoseId(nextDose.entry.id);
                setSelectedSite("");
              }}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full active:scale-95 transition-transform"
            >
              Take Dose
            </button>
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generateSchedule}
        disabled={generating}
        className="w-full bg-primary text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        {generating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <path d="M9 21h6" />
            </svg>
            {schedule.length > 0 ? "Regenerate Schedule" : "Generate AI Schedule"}
          </>
        )}
      </button>

      {error && (
        <div className="bg-danger/10 text-danger rounded-2xl p-3 text-sm">
          {error}
        </div>
      )}

      {summary && (
        <div className="bg-surface rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        </div>
      )}

      {tips.length > 0 && (
        <div>
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-sm font-medium text-primary flex items-center gap-1"
          >
            {showTips ? "Hide" : "Show"} Tips
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showTips ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showTips && (
            <ul className="mt-2 space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted flex gap-2">
                  <span className="text-primary shrink-0">&bull;</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Take Dose Sheet */}
      {takingDoseId && (
        <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[15px]">Select Injection Site</h3>
              <button
                onClick={() => { setTakingDoseId(null); setSelectedSite(""); }}
                className="text-primary text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {INJECTION_SITES.map((site) => (
              <button
                key={site}
                onClick={() => setSelectedSite(site)}
                className={`text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  selectedSite === site
                    ? "bg-primary text-white font-medium"
                    : "bg-surface-hover text-foreground"
                }`}
              >
                {site}
              </button>
            ))}
          </div>
          {selectedSite && (
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  const entry = schedule.find((e) => e.id === takingDoseId);
                  if (entry) handleTakeDose(entry);
                }}
                disabled={loggingDose}
                className="w-full bg-success text-white font-semibold py-3 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {loggingDose ? "Logging..." : "Confirm & Log Dose"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Weekly schedule */}
      {schedule.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-xs text-muted uppercase tracking-wider">
            Weekly Schedule
          </h3>
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const entries = byDay[dayIdx];
            const isToday = dayIdx === today;
            if (!entries || entries.length === 0) return null;

            return (
              <div
                key={dayIdx}
                className={`rounded-2xl p-3.5 ${
                  isToday
                    ? "bg-primary/6 border border-primary/15"
                    : "bg-surface shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                    {DAY_SHORT[dayIdx]}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-semibold text-white bg-primary px-2 py-0.5 rounded-full">
                      TODAY
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">
                          {entry.peptides?.name || "Unknown"}
                        </span>
                        <span className="text-muted text-sm ml-1.5">
                          {mcgToMg(entry.dose_mcg)} mg
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted">
                          {TIME_LABELS[entry.time_of_day]}
                        </span>
                        <button
                          onClick={() => {
                            setTakingDoseId(entry.id);
                            setSelectedSite("");
                          }}
                          className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                        >
                          Take
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button
            onClick={clearSchedule}
            className="text-sm text-muted hover:text-danger transition-colors"
          >
            Clear schedule
          </button>
        </div>
      ) : (
        !generating && (
          <p className="text-muted text-sm text-center py-6">
            No schedule yet. Generate one above based on your current protocol.
          </p>
        )
      )}

      <p className="text-xs text-muted text-center pt-3 border-t border-border/50">
        Always follow your healthcare provider&apos;s instructions. This is an
        AI assistant and does not replace medical advice.
      </p>
    </div>
  );
}
