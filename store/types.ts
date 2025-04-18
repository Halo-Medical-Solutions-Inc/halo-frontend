interface User {
  user_id?: string;
  created_at?: string;
  modified_at?: string;
  status?: "ACTIVE" | "INACTIVE";
  name?: string;
  email?: string;
  password?: string;
  default_template_id?: string;
  default_language?: string;
  template_ids?: string[];
  visit_ids?: string[];
}

interface Visit {
  visit_id?: string;
  user_id?: string;
  created_at?: string;
  modified_at?: string;
  status?: "NOT_STARTED" | "PAUSED" | "RECORDING" | "GENERATING_NOTE" | "FINISHED";
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
  status?: "DEFAULT" | "READY" | "ERROR";
  name?: string;
  instructions?: string;
  print?: string;
}

interface Session {
  session_id?: string;
  user_id?: string;
  expiration_date?: string;
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
