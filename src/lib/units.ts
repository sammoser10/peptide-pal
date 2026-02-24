/**
 * Calculate syringe units for a given dose.
 *
 * Standard insulin syringes: 100 units = 1 ml
 *
 * @param doseMcg - Dose in micrograms
 * @param vialSizeMg - Total peptide in the vial (mg)
 * @param reconstitutionVolumeMl - Amount of bacteriostatic water added (ml)
 * @returns Number of syringe units, or null if reconstitution info is missing
 */
export function doseToUnits(
  doseMcg: number,
  vialSizeMg: number | null,
  reconstitutionVolumeMl: number | null
): number | null {
  if (!vialSizeMg || !reconstitutionVolumeMl || vialSizeMg <= 0 || reconstitutionVolumeMl <= 0) {
    return null;
  }

  // concentration in mg/ml
  const concentrationMgPerMl = vialSizeMg / reconstitutionVolumeMl;
  // dose in mg
  const doseMg = doseMcg / 1000;
  // volume needed in ml
  const volumeMl = doseMg / concentrationMgPerMl;
  // convert to insulin units (100 units = 1 ml)
  const units = volumeMl * 100;

  return Math.round(units * 10) / 10; // round to 1 decimal
}

/**
 * Reverse calculation: convert syringe units back to micrograms.
 */
export function unitsToDoseMcg(
  units: number,
  vialSizeMg: number | null,
  reconstitutionVolumeMl: number | null
): number | null {
  if (!vialSizeMg || !reconstitutionVolumeMl || vialSizeMg <= 0 || reconstitutionVolumeMl <= 0) {
    return null;
  }

  const concentrationMgPerMl = vialSizeMg / reconstitutionVolumeMl;
  const volumeMl = units / 100;
  const doseMg = volumeMl * concentrationMgPerMl;
  const doseMcg = doseMg * 1000;

  return Math.round(doseMcg * 10) / 10;
}

/**
 * Format a dose for display, showing units if reconstitution info is available.
 * e.g. "10 units (500 mcg)" or just "500 mcg"
 */
export function formatDose(
  doseMcg: number,
  vialSizeMg: number | null,
  reconstitutionVolumeMl: number | null
): string {
  const units = doseToUnits(doseMcg, vialSizeMg, reconstitutionVolumeMl);
  if (units !== null) {
    return `${units} units (${doseMcg} mcg)`;
  }
  return `${doseMcg} mcg`;
}
