/**
 * Session management for the ATS auth system.
 * Stores session in both localStorage (for SPA reads) and a cookie (for middleware reads).
 */

import type { Role } from "@/lib/data/types";

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: Role;
  expiresAt: number; // Unix ms
  sessionToken: string;
}

const SESSION_KEY = "ats_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function setCookie(value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_KEY}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(userId: string, name: string, email: string, role: Role, sessionToken?: string): Session {
  const session: Session = {
    userId,
    name,
    email,
    role,
    expiresAt: Date.now() + SESSION_DURATION_MS,
    sessionToken: sessionToken ?? crypto.randomUUID(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  setCookie(
    JSON.stringify({ userId, role, expiresAt: session.expiresAt, sessionToken: session.sessionToken }),
    SESSION_DURATION_MS / 1000
  );
  return session;
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
  clearCookie();
}
