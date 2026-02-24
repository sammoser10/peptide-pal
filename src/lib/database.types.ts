export interface Peptide {
  id: string;
  user_id: string;
  name: string;
  default_dose_mcg: number;
  frequency_description: string;
  notes: string | null;
  vial_size_mg: number | null;
  reconstitution_volume_ml: number | null;
  archived: boolean;
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

export interface UserPreferences {
  // Body composition
  height_cm?: number;
  weight_kg?: number;
  body_fat_pct?: number;
  sex?: "male" | "female" | "other";
  age?: number;

  // Goals
  goals?: string[];

  // Experience & approach
  experience_level?: "beginner" | "intermediate" | "advanced";
  injection_comfort?: "new" | "comfortable" | "experienced";
  aggressiveness?: "conservative" | "moderate" | "aggressive";

  // Preferences
  preferred_injection_time?: string;
  preferred_sites?: string[];
  blends?: Blend[];
  notes?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  syringe_size_ml: number;
  onboarding_completed: boolean;
  preferences: UserPreferences | null;
  created_at: string;
}

export interface ScheduleEntry {
  id: string;
  user_id: string;
  peptide_id: string;
  day_of_week: number; // 0=Sunday through 6=Saturday
  time_of_day: "morning" | "afternoon" | "evening";
  dose_mcg: number;
  notes: string | null;
  created_at: string;
}

export interface ScheduleEntryWithPeptide extends ScheduleEntry {
  peptides: Peptide;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Blend {
  id: string;
  name: string;
  peptide_ids: string[];
}

export interface AIPeptideResult {
  name: string;
  default_dose_mcg: number;
  frequency_description: string;
  notes: string;
  vial_size_mg: number | null;
  reconstitution_volume_ml: number | null;
}
