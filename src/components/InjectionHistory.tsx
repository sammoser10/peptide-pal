"use client";

import { useState, useEffect, useCallback } from "react";
import type { InjectionWithPeptide } from "@/lib/database.types";

interface InjectionHistoryProps {
  refreshKey: number;
}

export default function InjectionHistory({ refreshKey }: InjectionHistoryProps) {
  const [injections, setInjections] = useState<InjectionWithPeptide[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInjections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/injections?limit=50");
      const data = await res.json();
      if (Array.isArray(data)) setInjections(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInjections();
  }, [refreshKey, loadInjections]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this injection log?")) return;
    await fetch(`/api/injections/${id}`, { method: "DELETE" });
    loadInjections();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (injections.length === 0) {
    return (
      <p className="text-muted text-sm text-center py-8">
        No injections logged yet. Use the Log tab to record your first one.
      </p>
    );
  }

  // Group injections by date
  const grouped: Record<string, InjectionWithPeptide[]> = {};
  for (const inj of injections) {
    const date = new Date(inj.injection_time).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(inj);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-muted mb-2 sticky top-0 bg-background py-1">
            {date}
          </h3>
          <div className="space-y-2">
            {items.map((inj) => (
              <div
                key={inj.id}
                className="bg-surface border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {inj.peptides?.name || "Unknown"}
                      </span>
                      <span className="text-sm text-muted">
                        {inj.dose_mcg} mcg
                      </span>
                    </div>
                    <div className="text-sm text-muted mt-1">
                      {inj.injection_site} &middot;{" "}
                      {new Date(inj.injection_time).toLocaleTimeString(
                        "en-US",
                        { hour: "numeric", minute: "2-digit" }
                      )}
                    </div>
                    {inj.notes && (
                      <div className="text-sm text-muted mt-1 italic">
                        {inj.notes}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(inj.id)}
                    className="text-muted hover:text-danger p-2 -m-2 transition-colors"
                    aria-label="Delete injection"
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
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
