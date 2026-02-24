"use client";

import { useState, useEffect, useCallback } from "react";
import type { InjectionWithPeptide } from "@/lib/database.types";

interface CalendarViewProps {
  refreshKey: number;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export default function CalendarView({ refreshKey }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [injections, setInjections] = useState<InjectionWithPeptide[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadInjections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/injections?limit=200");
      const data = await res.json();
      if (Array.isArray(data)) setInjections(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInjections();
  }, [refreshKey, loadInjections]);

  // Group injections by date key
  const injectionsByDate: Record<string, InjectionWithPeptide[]> = {};
  for (const inj of injections) {
    const key = toDateKey(new Date(inj.injection_time));
    if (!injectionsByDate[key]) injectionsByDate[key] = [];
    injectionsByDate[key].push(inj);
  }

  // Get unique peptide names for color assignment
  const peptideNames = Array.from(
    new Set(injections.map((inj) => inj.peptides?.name || "Unknown"))
  );

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
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;

            // Get unique peptides for this day's dots
            const uniquePeptides = Array.from(
              new Set(
                dayInjections.map((inj) => inj.peptides?.name || "Unknown")
              )
            );

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
                {uniquePeptides.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {uniquePeptides.slice(0, 3).map((name) => (
                      <span
                        key={name}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? "bg-white/70" : getPeptideColor(name)
                        }`}
                      />
                    ))}
                    {uniquePeptides.length > 3 && (
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
          {selectedInjections.length === 0 ? (
            <p className="text-sm text-muted">No injections on this day.</p>
          ) : (
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
                      {inj.dose_mcg} mcg
                    </span>
                    <span className="text-muted ml-2">
                      {inj.injection_site}
                    </span>
                  </div>
                  <span className="text-muted shrink-0">
                    {new Date(inj.injection_time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
