import { type AboutResponse } from "../features/widgets/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function fetchAbout(): Promise<AboutResponse> {
  const res = await fetch(`${API_URL}/about.json`);
  if (!res.ok) throw new Error("Failed to load services");
  return res.json();
}

export async function fetchWidgetData(service: string, widget: string, config: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/widgets/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ service, widget, config }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Widget request failed");
  }
  return (await res.json()).data;
}

export interface AuthUser {
  email: string;
}

export async function loginRequest(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || "Invalid email or password");
  return body;
}

export async function registerRequest(email: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || body.error || "Could not create account");
  return body;
}