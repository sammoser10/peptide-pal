export interface Peptide {
  id: string;
  user_id: string;
  name: string;
  default_dose_mcg: number;
  frequency_description: string;
  notes: string | null;
  vial_size_mg: number | null;
  reconstitution_volume_ml: number | null;
  created_at: string;
}

export interface Injection {
  id: string;
  user_id: string;
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

export interface UserProfile {
  id: string;
  user_id: string;
  syringe_size_ml: number;
  onboarding_completed: boolean;
  created_at: string;
}
