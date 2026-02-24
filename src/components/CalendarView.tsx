"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { formatDose } from "@/lib/units";
import type {
  InjectionWithPeptide,
  ScheduleEntryWithPeptide,
} from "@/lib/database.types";

interface CalendarViewProps {
  refreshKey: number;
}

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function formatMonthYear(year: number, month: number) {
  return new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function mcgToMg(mcg: number): string {
  return String(Math.round((mcg / 1000) * 10000) / 10000);
}

export default function CalendarView({ refreshKey }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [injections, setInjections] = useState<InjectionWithPeptide[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntryWithPeptide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [injRes, schedRes] = await Promise.all([
        apiFetch("/api/injections?limit=200"),
        apiFetch("/api/schedule"),
      ]);
      const injData = await injRes.json();
      const schedData = await schedRes.json();
      if (Array.isArray(injData)) setInjections(injData);
      if (Array.isArray(schedData)) setSchedule(schedData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [refreshKey, loadData]);

  // Group injections by date key
  const injectionsByDate: Record<string, InjectionWithPeptide[]> = {};
  for (const inj of injections) {
    const key = toDateKey(new Date(inj.injection_time));
    if (!injectionsByDate[key]) injectionsByDate[key] = [];
    injectionsByDate[key].push(inj);
  }

  // Get scheduled entries for a given date based on day_of_week
  function getScheduledForDate(dateKey: string): ScheduleEntryWithPeptide[] {
    const d = new Date(dateKey + "T12:00:00");
    const dow = d.getDay();
    return schedule.filter((s) => s.day_of_week === dow);
  }

  const { firstDay, daysInMonth } = getMonthDays(year, month);
  const todayKey = toDateKey(today);

  function goToPrevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDate(null);
  }

  function goToNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDate(null);
  }

  function goToToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDate(todayKey);
  }

  // Build calendar grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedInjections = selectedDate
    ? injectionsByDate[selectedDate] || []
    : [];
  const selectedScheduled = selectedDate
    ? getScheduledForDate(selectedDate)
    : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors"
          aria-label="Previous month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={goToToday}
          className="text-[17px] font-semibold hover:text-primary transition-colors"
        >
          {formatMonthYear(year, month)}
        </button>
        <button
          onClick={goToNextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors"
          aria-label="Next month"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={i} className="text-xs font-medium text-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid - bubble style */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="flex items-center justify-center h-11" />;
            }
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayInjections = injectionsByDate[dateKey] || [];
            const dayScheduled = getScheduledForDate(dateKey);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const hasLogged = dayInjections.length > 0;
            const hasScheduled = dayScheduled.length > 0;
            const isPast = dateKey < todayKey;

            // Determine bubble shading
            let bubbleClass = "";
            if (isSelected) {
              bubbleClass = "bg-primary text-white shadow-sm";
            } else if (isToday) {
              bubbleClass = hasLogged
                ? "bg-success/15 text-success font-bold ring-2 ring-success/30"
                : "bg-primary/12 text-primary font-bold ring-2 ring-primary/30";
            } else if (hasLogged) {
              bubbleClass = "bg-success/10 text-success font-semibold";
            } else if (hasScheduled && !isPast) {
              bubbleClass = "bg-primary/8 text-primary/70";
            } else {
              bubbleClass = "text-foreground hover:bg-surface-hover";
            }

            return (
              <div key={dateKey} className="flex items-center justify-center">
                <button
                  onClick={() =>
                    setSelectedDate(isSelected ? null : dateKey)
                  }
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all ${bubbleClass}`}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Minimal legend */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-success/20 border border-success/40" />
          Logged
        </div>
        {schedule.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary/15 border border-primary/30" />
            Scheduled
          </div>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-[15px] mb-3">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>

          {/* Logged injections */}
          {selectedInjections.length > 0 && (
            <div className="mb-3">
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                Logged
              </div>
              <div className="space-y-2">
                {selectedInjections.map((inj) => (
                  <div
                    key={inj.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">
                        {inj.peptides?.name || "Unknown"}
                      </span>
                      <span className="text-muted ml-2">
                        {formatDose(
                          inj.dose_mcg,
                          inj.peptides?.vial_size_mg,
                          inj.peptides?.reconstitution_volume_ml
                        )}
                      </span>
                      <span className="text-muted ml-2">
                        {inj.injection_site}
                      </span>
                    </div>
                    <span className="text-muted text-xs shrink-0">
                      {new Date(inj.injection_time).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled doses */}
          {selectedScheduled.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                Scheduled
              </div>
              <div className="space-y-2">
                {selectedScheduled.map((entry) => {
                  const wasLogged = selectedInjections.some(
                    (inj) => inj.peptide_id === entry.peptide_id
                  );
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 text-sm ${wasLogged ? "opacity-40 line-through" : ""}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 border-2 ${
                          wasLogged ? "border-muted" : "border-primary"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">
                          {entry.peptides?.name || "Unknown"}
                        </span>
                        <span className="text-muted ml-2">
                          {mcgToMg(entry.dose_mcg)} mg
                        </span>
                      </div>
                      <span className="text-muted text-xs shrink-0">
                        {TIME_LABELS[entry.time_of_day] || entry.time_of_day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedInjections.length === 0 &&
            selectedScheduled.length === 0 && (
              <p className="text-sm text-muted">
                No injections or scheduled doses on this day.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
