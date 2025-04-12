import { SessionState } from "./slices/sessionSlice";
import { TemplateState } from "./slices/templateSlice";
import { UserState } from "./slices/userSlice";
import { VisitState } from "./slices/visitSlice";

interface User {
  _id?: string;
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
  _id?: string;
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
  _id?: string;
  user_id?: string;
  created_at?: string;
  modified_at?: string;
  status?: "DEFAULT" | "READY" | "ERROR";
  name?: string;
  instructions?: string;
  print?: string;
}

interface Session {
  _id?: string;
  user_id?: string;
  expiration_date?: string;
}

export type { User, Visit, Template, Session };

export const testState: SessionState = {
  screen: "ACCOUNT",
  session: {
    _id: "test-session-id",
    user_id: "test-user-id",
    expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  isAuthenticated: true,
};

export const initialTemplateState: TemplateState = {
  templates: [
    {
      _id: "template-1",
      user_id: "test-user-id",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      status: "READY",
      name: "General Checkup Template",
      instructions: "Use this template for general medical checkups.",
      print: "Print format for general checkup.",
    },
    {
      _id: "template-2",
      user_id: "test-user-id",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      status: "READY",
      name: "Specialist Consultation Template",
      instructions: "Use this template for specialist consultations.",
      print: "Print format for specialist consultation.",
    },
    {
      _id: "template-3",
      user_id: "test-user-id",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      status: "DEFAULT",
      name: "Follow-up Template",
      instructions: "Use this template for follow-up appointments.",
      print: "Print format for follow-up.",
    },
  ],
  selectedTemplate: {
    _id: "template-1",
    user_id: "test-user-id",
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    status: "READY",
    name: "General Checkup Template",
    instructions: "Use this template for general medical checkups.",
    print: "Print format for general checkup.",
  },
  loading: false,
  error: null,
};

export const initialUserState: UserState = {
  user: {
    _id: "test-user-id",
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    status: "ACTIVE",
    name: "Test User",
    email: "test@example.com",
    password: "hashedPassword123",
    default_template_id: "template-1",
    default_language: "en",
    template_ids: ["template-1", "template-2", "template-3"],
    visit_ids: ["visit-1", "visit-2"],
  },
  loading: false,
  error: null,
};

export const initialVisitState: VisitState = {
  visits: [
    {
      _id: "visit-1",
      user_id: "test-user-id",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      status: "NOT_STARTED",
      name: "Annual Checkup",
      template_modified_at: new Date().toISOString(),
      template_id: "template-1",
      language: "en",
      additional_context: "",
      recording_started_at: undefined,
      recording_duration: 0,
      recording_finished_at: undefined,
      transcript: "",
      note: "",
    },
    {
      _id: "visit-2",
      user_id: "test-user-id",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      status: "NOT_STARTED",
      name: "Follow-up Appointment",
      template_modified_at: new Date().toISOString(),
      template_id: "template-3",
      language: "en",
      additional_context: "Follow-up for medication adjustment",
      recording_started_at: undefined,
      recording_duration: 0,
      recording_finished_at: undefined,
      transcript: "",
      note: "",
    },
    {
      _id: "visit-3",
      user_id: "test-user-id",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      status: "NOT_STARTED",
      name: "Recording Visit",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "This visit was deleted",
      recording_started_at: undefined,
      recording_duration: 0,
      recording_finished_at: undefined,
      transcript: "",
      note: "",
    },
    {
      _id: "visit-4",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Pediatric Consultation",
      template_modified_at: new Date().toISOString(),
      template_id: "template-3",
      language: "en",
      additional_context: "Child's annual checkup",
      recording_started_at: new Date(Date.now() - 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
      recording_duration: 30 * 60,
      recording_finished_at: new Date(Date.now() - 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
      transcript: "Pediatric consultation transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Child presents for annual checkup. Parents report normal development and no concerns.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Height and weight appropriate for age. All developmental milestones met. Physical examination normal.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Child is developing normally with no health concerns identified.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Vaccines updated according to schedule. Continue regular well-child visits. Next appointment in 6 months.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-5",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: "RECORDING",
      name: "Dermatology Consult",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Patient has eczema",
      recording_started_at: new Date(Date.now() - 24 * 60 * 60 * 1000 - 120 * 60 * 1000).toISOString(),
      recording_duration: 30 * 60,
      recording_finished_at: new Date(Date.now() - 24 * 60 * 60 * 1000 - 90 * 60 * 1000).toISOString(),
      transcript: "Dermatology consultation transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Patient presents with eczema flare-up on both arms and neck. Reports increased itching and discomfort over past week.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Erythematous patches with scaling on bilateral forearms and posterior neck. No signs of infection.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Moderate eczema flare-up likely triggered by seasonal changes and reported stress.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Prescribed topical steroid cream for eczema flare-up. Recommended daily moisturizing and avoiding known triggers. Follow-up in 2 weeks.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-6",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Cardiology Follow-up",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Post-heart attack follow-up",
      recording_started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
      recording_duration: 30 * 60,
      recording_finished_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
      transcript: "Cardiology follow-up transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Patient reports feeling better since hospital discharge. No chest pain, shortness of breath, or palpitations.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Vital signs stable. Heart rate regular. Recent ECG shows normal sinus rhythm. Lipid panel improved from previous values.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Patient recovering well post-myocardial infarction. Good response to current medication regimen.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Continue current medication regimen. Cardiac rehabilitation twice weekly. Follow-up in 3 months with repeat lipid panel.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-7",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Orthopedic Assessment",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Knee pain evaluation",
      recording_started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 75 * 60 * 1000).toISOString(),
      recording_duration: 30 * 60,
      recording_finished_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
      transcript: "Orthopedic assessment transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Patient reports left knee pain for 3 weeks following tennis match. Pain worsens with weight bearing and twisting motions.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Left knee with mild effusion. Positive McMurray test. Limited range of motion with pain on flexion beyond 90 degrees.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Clinical findings consistent with meniscus tear of the left knee.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>MRI ordered for left knee. Suspect meniscus tear. RICE protocol advised. Follow-up after imaging results available.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-8",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Psychiatric Evaluation",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Depression screening",
      recording_started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 180 * 60 * 1000).toISOString(),
      recording_duration: 60 * 60,
      recording_finished_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 120 * 60 * 1000).toISOString(),
      transcript: "Psychiatric evaluation transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Patient reports persistent low mood, decreased interest in activities, and difficulty sleeping for past 2 months following job loss.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>PHQ-9 score of 12 indicating moderate depression. Affect flat. No suicidal ideation. Cognitive function intact.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Adjustment disorder with depressed mood, moderate severity. Symptoms consistent with major depressive disorder.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Starting on low-dose SSRI (sertraline 50mg daily). Weekly therapy sessions recommended. Follow-up in 3 weeks to assess medication response.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-9",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Neurology Consult",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Migraine assessment",
      recording_started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 90 * 60 * 1000).toISOString(),
      recording_duration: 45 * 60,
      recording_finished_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
      transcript: "Neurology consultation transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Patient reports 3-4 migraines weekly for past 6 months. Describes throbbing pain, visual aura, and nausea. Triggers include stress and lack of sleep.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Neurological examination normal. No focal deficits. Previous MRI showed no intracranial abnormalities.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Chronic migraine without aura, meeting criteria for preventative therapy.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Starting preventative medication (topiramate 25mg daily, titrating up). Sumatriptan for acute attacks. Headache diary recommended. Follow-up in 6 weeks.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-10",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Pediatric Consultation",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Child's annual checkup",
      recording_started_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
      recording_duration: 30 * 60,
      recording_finished_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
      transcript: "Pediatric consultation transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Child presents for annual checkup. Parents report normal development and no concerns.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Height and weight appropriate for age. All developmental milestones met. Physical examination normal.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Child is developing normally with no health concerns identified.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Vaccines updated according to schedule. Continue regular well-child visits. Next appointment in 12 months.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-11",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Pediatric Consultation",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Child's annual checkup",
      recording_started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
      recording_duration: 30 * 60,
      recording_finished_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
      transcript: "Pediatric consultation transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Child presents for annual checkup. Parents report normal development and no concerns.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Height and weight appropriate for age. All developmental milestones met. Physical examination normal.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Child is developing normally with no health concerns identified.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Vaccines updated according to schedule. Continue regular well-child visits. Next appointment in 12 months.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-12",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Pediatric Consultation",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Child's annual checkup",
      recording_started_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
      recording_duration: 30 * 60,
      recording_finished_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
      transcript: "Pediatric consultation transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Child presents for annual checkup. Parents report normal development and no concerns.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Height and weight appropriate for age. All developmental milestones met. Physical examination normal.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Child is developing normally with no health concerns identified.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Vaccines updated according to schedule. Continue regular well-child visits. Next appointment in 12 months.</body>
</note_section>
</note>`,
    },
    {
      _id: "visit-13",
      user_id: "test-user-id",
      created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      modified_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      status: "FINISHED",
      name: "Pediatric Consultation",
      template_modified_at: new Date().toISOString(),
      template_id: "template-2",
      language: "en",
      additional_context: "Child's annual checkup",
      recording_started_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 - 45 * 60 * 1000).toISOString(),
      recording_duration: 30 * 60,
      recording_finished_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString(),
      transcript: "Pediatric consultation transcript",
      note: `<note>
<note_section>
<title>SUBJECTIVE</title>
<body>Child presents for annual checkup. Parents report normal development and no concerns.</body>
</note_section>
<note_section>
<title>OBJECTIVE</title>
<body>Height and weight appropriate for age. All developmental milestones met. Physical examination normal.</body>
</note_section>
<note_section>
<title>ASSESSMENT</title>
<body>Child is developing normally with no health concerns identified.</body>
</note_section>
<note_section>
<title>PLAN</title>
<body>Vaccines updated according to schedule. Continue regular well-child visits. Next appointment in 12 months.</body>
</note_section>
</note>`,
    },
  ],
  selectedVisit: {
    _id: "visit-1",
    user_id: "test-user-id",
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
    status: "NOT_STARTED",
    name: "Annual Checkup",
    template_modified_at: new Date().toISOString(),
    template_id: "template-1",
    language: "en",
    additional_context: "",
    recording_started_at: undefined,
    recording_duration: 0,
    recording_finished_at: undefined,
    transcript: "",
    note: "",
  },
  loading: false,
  error: null,
};

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