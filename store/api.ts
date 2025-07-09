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

export async function apiGetUserVisits(sessionId: string, subset: boolean = true, offset: number = 0, limit: number = 20): Promise<Visit[]> {
  const response = await fetch(`${API_URL}/user/get_visits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, subset: subset, offset: offset, limit: limit }),
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

export async function apiProcessFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/audio/process_file`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to process file: ${errorText}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    return typeof data === "string" ? data : JSON.stringify(data);
  }

  return response.text();
}

export async function apiVerifyEMRIntegration(sessionId: string, emr: string, credentials: Record<string, string>): Promise<User> {
  const response = await fetch(`${API_URL}/integration/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, emr: emr, credentials: credentials }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to verify EMR integration");
  return response.json();
}

export async function apiGetPatientsEMRIntegration(sessionId: string): Promise<any> {
  const response = await fetch(`${API_URL}/integration/get_patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to get patients EMR integration");
  return response.json();
}

export async function apiCreateNoteEMRIntegration(sessionId: string, patientId: string, visitId: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/integration/create_note`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, patient_id: patientId, visit_id: visitId }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to create note EMR");
  return response.json();
}

export async function apiAskChat(sessionId: string, message: string): Promise<string> {
  const response = await fetch(`${API_URL}/chat/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message: message }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to ask chat");
  return response.json();
}

export async function apiVerifyEmail(sessionId: string, code: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/user/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, code: code }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to verify email");
  return response.json();
}

export async function apiResendVerification(sessionId: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/user/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to resend verification");
  return response.json();
}

export async function apiRequestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/user/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to request password reset");
  return response.json();
}

export async function apiVerifyResetCode(email: string, code: string): Promise<{ message: string; valid: boolean }> {
  const response = await fetch(`${API_URL}/user/verify-reset-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, code: code }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to verify reset code");
  return response.json();
}

export async function apiResetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/user/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, code: code, new_password: newPassword }),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to reset password");
  return response.json();
}
