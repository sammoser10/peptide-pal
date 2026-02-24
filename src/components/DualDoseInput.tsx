"use client";

import { useState, useCallback, useMemo } from "react";
import { doseToUnits, unitsToDoseMcg } from "@/lib/units";

interface Props {
  doseMcg: string;
  onDoseMcgChange: (mcg: string) => void;
  vialSizeMg: number | null;
  reconstitutionVolumeMl: number | null;
}

export default function DualDoseInput({
  doseMcg,
  onDoseMcgChange,
  vialSizeMg,
  reconstitutionVolumeMl,
}: Props) {
  // Only used when the units field is actively being typed in
  const [localUnits, setLocalUnits] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<"mcg" | "units" | null>(null);

  const hasReconInfo = !!(vialSizeMg && reconstitutionVolumeMl);

  // Derive units from mcg (used when user is NOT actively typing in units field)
  const derivedUnits = useMemo(() => {
    if (!doseMcg || !hasReconInfo) return "";
    const units = doseToUnits(parseFloat(doseMcg), vialSizeMg, reconstitutionVolumeMl);
    return units !== null ? String(units) : "";
  }, [doseMcg, vialSizeMg, reconstitutionVolumeMl, hasReconInfo]);

  // Show local value when actively editing units, otherwise show derived
  const displayedUnits = activeField === "units" && localUnits !== null ? localUnits : derivedUnits;

  const handleMcgChange = useCallback(
    (value: string) => {
      setLocalUnits(null);
      onDoseMcgChange(value);
    },
    [onDoseMcgChange]
  );

  const handleUnitsChange = useCallback(
    (value: string) => {
      setLocalUnits(value);
      if (!value) {
        onDoseMcgChange("");
        return;
      }
      const mcg = unitsToDoseMcg(parseFloat(value), vialSizeMg, reconstitutionVolumeMl);
      if (mcg !== null) {
        onDoseMcgChange(String(mcg));
      }
    },
    [vialSizeMg, reconstitutionVolumeMl, onDoseMcgChange]
  );

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Dose</label>
      <div className="flex items-center gap-0">
        {/* MCG bubble */}
        <div className="flex-1 relative">
          <input
            type="number"
            step="any"
            value={doseMcg}
            onChange={(e) => handleMcgChange(e.target.value)}
            onFocus={() => setActiveField("mcg")}
            onBlur={() => setActiveField(null)}
            required
            placeholder="250"
            className={`w-full border rounded-l-xl rounded-r-none px-3 py-3 text-foreground text-center font-medium transition-colors ${
              activeField === "mcg"
                ? "bg-primary/10 border-primary ring-1 ring-primary"
                : "bg-surface border-border"
            }`}
          />
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted font-medium uppercase tracking-wide">
            mcg
          </span>
        </div>

        {/* Sync indicator */}
        <div className="flex items-center justify-center w-10 shrink-0 -mx-[1px] z-10">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              hasReconInfo
                ? "bg-primary/10 border-primary"
                : "bg-surface-hover border-border"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={hasReconInfo ? "text-primary" : "text-muted"}
            >
              <path d="M8 3l4 4-4 4" />
              <path d="M16 21l-4-4 4-4" />
              <path d="M12 7h7a2 2 0 0 1 2 2v1" />
              <path d="M12 17H5a2 2 0 0 1-2-2v-1" />
            </svg>
          </div>
        </div>

        {/* Units bubble */}
        <div className="flex-1 relative">
          <input
            type="number"
            step="any"
            value={displayedUnits}
            onChange={(e) => handleUnitsChange(e.target.value)}
            onFocus={() => {
              setActiveField("units");
              setLocalUnits(derivedUnits);
            }}
            onBlur={() => {
              setActiveField(null);
              setLocalUnits(null);
            }}
            disabled={!hasReconInfo}
            placeholder={hasReconInfo ? "10" : "—"}
            className={`w-full border rounded-r-xl rounded-l-none px-3 py-3 text-center font-medium transition-colors ${
              !hasReconInfo
                ? "bg-surface-hover border-border text-muted cursor-not-allowed"
                : activeField === "units"
                  ? "bg-primary/10 border-primary ring-1 ring-primary text-foreground"
                  : "bg-surface border-border text-foreground"
            }`}
          />
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted font-medium uppercase tracking-wide">
            units
          </span>
        </div>
      </div>

      {!hasReconInfo && (
        <p className="text-xs text-muted mt-1.5 text-center">
          Add reconstitution info to your peptide to enable unit conversion
        </p>
      )}
    </div>
  );
}
