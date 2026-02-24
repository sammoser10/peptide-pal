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

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  // Get unique peptide names for color assignment
  const allPeptideNames = new Set<string>();
  for (const inj of injections) {
    allPeptideNames.add(inj.peptides?.name || "Unknown");
  }
  for (const s of schedule) {
    allPeptideNames.add(s.peptides?.name || "Unknown");
  }
  const peptideNames = Array.from(allPeptideNames);

  const DOT_COLORS = [
    "bg-primary",
    "bg-success",
    "bg-warning",
    "bg-danger",
    "bg-primary-light",
  ];

  function getPeptideColor(name: string) {
    const idx = peptideNames.indexOf(name);
    return DOT_COLORS[idx % DOT_COLORS.length];
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
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          aria-label="Previous month"
        >
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
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          onClick={goToToday}
          className="text-lg font-semibold hover:text-primary transition-colors"
        >
          {formatMonthYear(year, month)}
        </button>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          aria-label="Next month"
        >
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
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }
            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayInjections = injectionsByDate[dateKey] || [];
            const dayScheduled = getScheduledForDate(dateKey);
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;

            // Logged peptides (solid dots)
            const loggedPeptides = Array.from(
              new Set(
                dayInjections.map((inj) => inj.peptides?.name || "Unknown")
              )
            );
            // Scheduled but not yet logged (hollow dots)
            const loggedNames = new Set(loggedPeptides);
            const scheduledOnly = Array.from(
              new Set(
                dayScheduled
                  .map((s) => s.peptides?.name || "Unknown")
                  .filter((n) => !loggedNames.has(n))
              )
            );

            const totalDots = loggedPeptides.length + scheduledOnly.length;

            return (
              <button
                key={dateKey}
                onClick={() =>
                  setSelectedDate(isSelected ? null : dateKey)
                }
                className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-colors relative ${
                  isSelected
                    ? "bg-primary text-white"
                    : isToday
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-surface-hover"
                }`}
              >
                <span className="text-sm">{day}</span>
                {totalDots > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {loggedPeptides.slice(0, 3).map((name) => (
                      <span
                        key={name}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-white/70" : getPeptideColor(name)
                        }`}
                      />
                    ))}
                    {scheduledOnly
                      .slice(0, Math.max(0, 3 - loggedPeptides.length))
                      .map((name) => (
                        <span
                          key={`s-${name}`}
                          className={`w-1.5 h-1.5 rounded-full border ${
                            isSelected
                              ? "border-white/60 bg-transparent"
                              : "border-primary/40 bg-transparent"
                          }`}
                        />
                      ))}
                    {totalDots > 3 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white/40" : "bg-muted"}`}
                      />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      {peptideNames.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          {peptideNames.map((name) => (
            <div key={name} className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${getPeptideColor(name)}`}
              />
              {name}
            </div>
          ))}
          {schedule.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border-2 border-primary/40" />
              Scheduled
            </div>
          )}
        </div>
      )}

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-3">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>

          {/* Logged injections */}
          {selectedInjections.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                Logged
              </div>
              <div className="space-y-2">
                {selectedInjections.map((inj) => (
                  <div
                    key={inj.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${getPeptideColor(inj.peptides?.name || "Unknown")}`}
                    />
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
                    <span className="text-muted shrink-0">
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
              <div className="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
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
                      className={`flex items-center gap-3 text-sm ${wasLogged ? "opacity-50 line-through" : ""}`}
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
                      <span className="text-muted shrink-0">
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
