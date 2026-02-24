export interface Peptide {
  id: string;
  name: string;
  default_dose_mcg: number;
  frequency_description: string;
  notes: string | null;
  created_at: string;
}

export interface Injection {
  id: string;
  peptide_id: string;
  dose_mcg: number;
  injection_site: string;
  injection_time: string;
  notes: string | null;
  created_at: string;
}

export interface InjectionWithPeptide extends Injection {
  peptides: Peptide;
}
