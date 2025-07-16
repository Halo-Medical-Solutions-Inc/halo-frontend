interface User {
  user_id?: string;
  created_at?: string;
  modified_at?: string;
  status?: "ACTIVE" | "INACTIVE" | "UNVERIFIED";
  name?: string;
  email?: string;
  password?: string;
  user_specialty?: string;
  default_template_id?: string;
  default_language?: string;
  note_generation_quality?: string;
  template_ids?: string[];
  visit_ids?: string[];
  emr_integration?: {
    emr?: "OFFICE_ALLY" | "ADVANCEMD" | "DR_CHRONO";
    verified?: boolean;
    credentials?: {
      [key: string]: string | undefined;
    };
  };
  subscription?: {
    plan: "NO_PLAN" | "CANCELLED" | "FREE" | "MONTHLY" | "YEARLY" | "CUSTOM";
    free_trial_used?: boolean;
    free_trial_expiration_date?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
  };
  miscellaneous?: {
    verification_code?: string;
    verification_expires_at?: string;
    reset_code?: string;
    reset_expires_at?: string;
  };
}

interface Visit {
  visit_id?: string;
  user_id?: string;
  created_at?: string;
  modified_at?: string;
  status?: "NOT_STARTED" | "PAUSED" | "RECORDING" | "GENERATING_NOTE" | "FINISHED" | "FRONTEND_TRANSITION";
  name?: string;
  template_modified_at?: string;
  template_id?: string;
  language?: string;
  additional_context?: string;
  recording_started_at?: string;
  recording_duration?: number;
  recording_finished_at?: string;
  transcript?: string;
  note?: string;
}

interface Template {
  template_id?: string;
  user_id?: string;
  created_at?: string;
  modified_at?: string;
  status?: "DEFAULT" | "READY" | "ERROR" | "GENERATING_TEMPLATE" | "EMR";
  name?: string;
  instructions?: string;
  print?: string;
  header?: string;
  footer?: string;
}

interface Session {
  session_id?: string;
  user_id?: string;
  expiration_date?: string;
  verification_needed?: boolean;
}

export type { User, Visit, Template, Session };

export const languages = [
  {
    language_id: "en",
    name: "English",
  },
  {
    language_id: "es",
    name: "Spanish",
  },
  {
    language_id: "hi",
    name: "Hindi",
  },
  {
    language_id: "fr",
    name: "French",
  },
  {
    language_id: "de",
    name: "German",
  },
  {
    language_id: "it",
    name: "Italian",
  },
  {
    language_id: "ja",
    name: "Japanese",
  },
  {
    language_id: "zh",
    name: "Chinese",
  },
];

export const specialties = [
  {
    specialty_id: "primary_care",
    name: "Primary Care",
  },
  {
    specialty_id: "specialty_care",
    name: "Specialty Care",
  },
  {
    specialty_id: "mental_health",
    name: "Mental Health",
  },
  {
    specialty_id: "pediatric",
    name: "Pediatric",
  },
  {
    specialty_id: "geriatric",
    name: "Geriatric",
  },
  {
    specialty_id: "women_health",
    name: "Women's Health",
  },
  {
    specialty_id: "physical_therapy",
    name: "Physical Therapy",
  },
];
