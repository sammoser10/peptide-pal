"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { ScheduleEntryWithPeptide } from "@/lib/database.types";

interface ScheduleViewProps {
  refreshKey: number;
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
const TIME_ICONS: Record<string, string> = {
  morning: "☀️",
  afternoon: "🌤️",
  evening: "🌙",
};

function mcgToMg(mcg: number): string {
  return String(Math.round((mcg / 1000) * 10000) / 10000);
}

export default function ScheduleView({ refreshKey }: ScheduleViewProps) {
  const [schedule, setSchedule] = useState<ScheduleEntryWithPeptide[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [showTips, setShowTips] = useState(false);

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

  async function generateSchedule() {
    setGenerating(true);
    setError("");
    try {
      // Get AI recommendation
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

      // Save the schedule
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

      // Reload
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

  // Group by day
  const byDay: Record<number, ScheduleEntryWithPeptide[]> = {};
  for (const entry of schedule) {
    if (!byDay[entry.day_of_week]) byDay[entry.day_of_week] = [];
    byDay[entry.day_of_week].push(entry);
  }

  // Sort within each day by time
  for (const day in byDay) {
    byDay[day].sort(
      (a, b) =>
        TIME_ORDER[a.time_of_day as keyof typeof TIME_ORDER] -
        TIME_ORDER[b.time_of_day as keyof typeof TIME_ORDER]
    );
  }

  // Figure out today and the next dose
  const today = new Date().getDay();

  function getNextDoseInfo(): { dayLabel: string; entry: ScheduleEntryWithPeptide } | null {
    if (schedule.length === 0) return null;
    // Look from today forward through 7 days
    for (let offset = 0; offset < 7; offset++) {
      const day = (today + offset) % 7;
      const entries = byDay[day];
      if (entries && entries.length > 0) {
        // If it's today, the "next" is the first one (simple heuristic)
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Next dose card */}
      {nextDose && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <div className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
            Next Dose — {nextDose.dayLabel}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {TIME_ICONS[nextDose.entry.time_of_day] || "💉"}
            </span>
            <div>
              <div className="font-bold text-lg">
                {nextDose.entry.peptides?.name || "Unknown"}
              </div>
              <div className="text-sm text-muted">
                {mcgToMg(nextDose.entry.dose_mcg)} mg &middot;{" "}
                {TIME_LABELS[nextDose.entry.time_of_day]}{" "}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate / regenerate button */}
      <button
        onClick={generateSchedule}
        disabled={generating}
        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            Generating your schedule...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <path d="M9 21h6" />
            </svg>
            {schedule.length > 0
              ? "Regenerate Schedule"
              : "Generate AI Schedule"}
          </>
        )}
      </button>

      {error && (
        <div className="bg-danger/10 text-danger rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <div>
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-sm font-medium text-primary flex items-center gap-1"
          >
            {showTips ? "Hide" : "Show"} Tips
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${showTips ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showTips && (
            <ul className="mt-2 space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted flex gap-2">
                  <span className="text-primary shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Weekly schedule */}
      {schedule.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wide">
            Weekly Schedule
          </h3>
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const entries = byDay[dayIdx];
            const isToday = dayIdx === today;
            if (!entries || entries.length === 0) return null;

            return (
              <div
                key={dayIdx}
                className={`rounded-xl border p-3 ${
                  isToday
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-sm font-bold ${
                      isToday ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {DAY_SHORT[dayIdx]}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                      TODAY
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span className="text-base shrink-0">
                        {TIME_ICONS[entry.time_of_day] || "💉"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">
                          {entry.peptides?.name || "Unknown"}
                        </span>
                        <span className="text-muted ml-1.5">
                          {mcgToMg(entry.dose_mcg)} mg
                        </span>
                      </div>
                      <span className="text-xs text-muted shrink-0">
                        {TIME_LABELS[entry.time_of_day]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Clear schedule */}
          <button
            onClick={clearSchedule}
            className="text-sm text-muted hover:text-danger transition-colors"
          >
            Clear schedule
          </button>
        </div>
      ) : (
        !generating && (
          <p className="text-muted text-sm text-center py-4">
            No schedule yet. Tap the button above to have AI generate a
            personalized dosing schedule based on your peptide stack and
            preferences.
          </p>
        )
      )}

      <p className="text-xs text-muted text-center pt-2 border-t border-border">
        Always follow your healthcare provider&apos;s instructions. This is an
        AI assistant and does not replace medical advice.
      </p>
    </div>
  );
}
