import { Session, Template, User, Visit } from "./types";

const API_URL = process.env.API_URL || "http://127.0.0.1:8000";

export async function signinUser(email: string, password: string): Promise<Session> {
  const response = await fetch(`${API_URL}/user/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error("Failed to sign in user");
  return response.json();
}

export async function signupUser(name: string, email: string, password: string): Promise<Session> {
  const response = await fetch(`${API_URL}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!response.ok) throw new Error("Failed to sign up user");
  return response.json();
}

export async function getUser(sessionId: string): Promise<User> {
  const response = await fetch(`${API_URL}/user/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to get user");
  return response.json();
}

export async function updateUser(
  sessionId: string,
  updates: {
    user_id: string;
    name?: string;
    email?: string;
    password?: string;
    default_template_id?: string;
    default_language?: string;
    template_ids?: string[];
    visit_ids?: string[];
  },
): Promise<User> {
  const response = await fetch(`${API_URL}/user/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      update_user: updates,
    }),
  });
  if (!response.ok) throw new Error("Failed to update user");
  return response.json();
}

export async function deleteUser(sessionId: string): Promise<void> {
  const response = await fetch(`${API_URL}/user/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to delete user");
}

export async function getUserTemplates(sessionId: string): Promise<Template[]> {
  const response = await fetch(`${API_URL}/user/get_templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to get user templates");
  return response.json();
}

export async function getUserVisits(sessionId: string): Promise<Visit[]> {
  const response = await fetch(`${API_URL}/user/get_visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to get user visits");
  return response.json();
}

export async function getTemplate(sessionId: string, templateId: string): Promise<Template> {
  const response = await fetch(`${API_URL}/template/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      template_id: templateId,
    }),
  });
  if (!response.ok) throw new Error("Failed to get template");
  return response.json();
}

export async function createTemplate(sessionId: string): Promise<Template> {
  const response = await fetch(`${API_URL}/template/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to create template");
  return response.json();
}

export async function updateTemplate(
  sessionId: string,
  updates: {
    template_id: string;
    name?: string;
    instructions?: string;
    print?: string;
  },
): Promise<Template> {
  const response = await fetch(`${API_URL}/template/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      update_template: updates,
    }),
  });
  if (!response.ok) throw new Error("Failed to update template");
  return response.json();
}

export async function deleteTemplate(sessionId: string, templateId: string): Promise<void> {
  const response = await fetch(`${API_URL}/template/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      template_id: templateId,
    }),
  });
  if (!response.ok) throw new Error("Failed to delete template");
}

export async function extractTemplate(sessionId: string): Promise<any> {
  const response = await fetch(`${API_URL}/template/generate_notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to extract template");
  return response.json();
}

export async function askAITemplate(sessionId: string): Promise<any> {
  const response = await fetch(`${API_URL}/template/ask_ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to ask AI");
  return response.json();
}

// Visit API functions
export async function getVisit(sessionId: string, visitId: string): Promise<Visit> {
  const response = await fetch(`${API_URL}/visit/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      visit_id: visitId,
    }),
  });
  if (!response.ok) throw new Error("Failed to get visit");
  return response.json();
}

export async function createVisit(sessionId: string): Promise<Visit> {
  const response = await fetch(`${API_URL}/visit/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to create visit");
  return response.json();
}

export async function updateVisit(
  sessionId: string,
  updates: {
    visit_id: string;
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
  },
): Promise<Visit> {
  const response = await fetch(`${API_URL}/visit/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      update_visit: updates,
    }),
  });
  if (!response.ok) throw new Error("Failed to update visit");
  return response.json();
}

export async function deleteVisit(sessionId: string, visitId: string): Promise<void> {
  const response = await fetch(`${API_URL}/visit/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      visit_id: visitId,
    }),
  });
  if (!response.ok) throw new Error("Failed to delete visit");
}

export async function generateNotes(sessionId: string): Promise<any> {
  const response = await fetch(`${API_URL}/visit/generate_notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to generate notes");
  return response.json();
}

export async function transcribeAudio(sessionId: string): Promise<any> {
  const response = await fetch(`${API_URL}/visit/transcribe_audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to transcribe audio");
  return response.json();
}

export async function askAIVisit(sessionId: string): Promise<any> {
  const response = await fetch(`${API_URL}/visit/ask_ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!response.ok) throw new Error("Failed to ask AI");
  return response.json();
}
