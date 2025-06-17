import { Session, Template, User, Visit } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiSigninUser(email: string, password: string): Promise<Session> {
  const response = await fetch(`${API_URL}/user/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to sign in user");
  return response.json();
}

export async function apiSignupUser(name: string, email: string, password: string): Promise<Session> {
  const response = await fetch(`${API_URL}/user/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to sign up user");
  return response.json();
}

export async function apiGetUser(sessionId: string): Promise<User> {
  const response = await fetch(`${API_URL}/user/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to get user");
  return response.json();
}

export async function apiGetUserTemplates(sessionId: string): Promise<Template[]> {
  const response = await fetch(`${API_URL}/user/get_templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to get user templates");
  return response.json();
}

export async function apiGetUserVisits(sessionId: string, subset: boolean = true): Promise<Visit[]> {
  const response = await fetch(`${API_URL}/user/get_visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, subset: subset }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to get user visits");
  return response.json();
}

export async function processAudioBuffer(sessionId: string, visitId: string, audioBuffer: ArrayBuffer): Promise<string> {
  const response = await fetch(`${API_URL}/audio/process_audio_buffer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, visit_id: visitId, audio_buffer: audioBuffer }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to process audio buffer");
  return response.json();
}

export async function apiVerifyEMRIntegration(sessionId: string, emrName: string, credentials: Record<string, string>): Promise<boolean> {
  const response = await fetch(`${API_URL}/user/verify_emr_integration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, emr_name: emrName, credentials: credentials }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to verify EMR integration");
  return response.json();
}
