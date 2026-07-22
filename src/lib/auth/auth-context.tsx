"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@/lib/auth/session";
import { clearSession, getSession, saveSession } from "@/lib/auth/session";
import { findUserByEmail, initUsersIfEmpty, verifyPassword, addUser, hashPassword } from "@/lib/auth/users";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Role } from "@/lib/data/types";

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const RATE_LIMIT_KEY = "ats_login_attempts";
const RATE_LIMIT_THRESHOLDS = [
  { min: 15, lockMs: 30 * 60 * 1000 },
  { min: 10, lockMs: 5 * 60 * 1000 },
  { min: 5, lockMs: 30 * 1000 },
] as const;

function getRateLimit(email: string): { allowed: boolean; retryAfterMs?: number } {
  if (typeof window === "undefined") return { allowed: true };
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { allowed: true };
    const map = JSON.parse(raw) as Record<string, { count: number; lockedUntil: number }>;
    const entry = map[email.toLowerCase()];
    if (!entry || !entry.lockedUntil) return { allowed: true };
    if (Date.now() > entry.lockedUntil) return { allowed: true };
    return { allowed: false, retryAfterMs: entry.lockedUntil - Date.now() };
  } catch {
    return { allowed: true };
  }
}

function recordFailedAttempt(email: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const map: Record<string, { count: number; lockedUntil: number }> = raw ? JSON.parse(raw) : {};
    const key = email.toLowerCase();
    const entry = map[key] ?? { count: 0, lockedUntil: 0 };
    entry.count += 1;
    for (const t of RATE_LIMIT_THRESHOLDS) {
      if (entry.count >= t.min) {
        entry.lockedUntil = Date.now() + t.lockMs;
        break;
      }
    }
    map[key] = entry;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

function clearRateLimit(email: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[email.toLowerCase()];
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        const { data: { session: supaSession } } = await supabase.auth.getSession();
        if (supaSession?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, role, active")
            .eq("id", supaSession.user.id)
            .maybeSingle();

          if (profile && profile.active !== false) {
            if (mounted) {
              const existing = getSession();
              setSession({
                userId: supaSession.user.id,
                name: profile.display_name || supaSession.user.email?.split("@")[0] || "User",
                email: supaSession.user.email!,
                role: (profile.role as Role) || "recruiter",
                expiresAt: (supaSession.expires_at || (Date.now() / 1000 + 8 * 3600)) * 1000,
                sessionToken: existing?.sessionToken ?? "",
              });
            }
          } else {
            if (mounted) setSession(null);
          }
        } else {
          if (mounted) setSession(null);
        }
      } else if (process.env.NEXT_PUBLIC_DEV_AUTH === "true") {
        await initUsersIfEmpty();
        if (mounted) setSession(getSession());
      } else {
        if (mounted) setSession(null);
      }
      
      if (mounted) setIsLoading(false);
    }

    init().catch(() => {
      if (mounted) {
        setSession(null);
        setIsLoading(false);
      }
    });

    return () => { mounted = false; };
  }, []);

  const signup = useCallback(
    async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
      const normalizedEmail = email.trim();

      if (!normalizedEmail.toLowerCase().endsWith("@huntsmenbarons.com")) {
        return { success: false, error: "Please use your @huntsmenbarons.com company email." };
      }

      if (password.length < 5) {
        return { success: false, error: "Password must be at least 5 characters." };
      }

      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: { data: { display_name: name } },
          });
          if (error) throw error;
          if (!data.user) throw new Error("Signup returned no user");

          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            display_name: name,
            role: "recruiter",
            active: true,
          });
          if (profileError) throw profileError;

          const sessionToken = crypto.randomUUID();
          const s = saveSession(data.user.id, name, data.user.email!, "recruiter", sessionToken);
          setSession(s);
          return { success: true };
        } catch (e) {
          return { success: false, error: "Signup error: " + (e instanceof Error ? e.message : "unknown") };
        }
      } else if (process.env.NEXT_PUBLIC_DEV_AUTH === "true") {
        try {
          await initUsersIfEmpty();
          const existing = findUserByEmail(normalizedEmail);
          if (existing) {
            return { success: false, error: "An account with this email already exists." };
          }

          const hash = await hashPassword(password);
          const newUser = {
            id: `user-${Date.now()}`,
            name,
            email: normalizedEmail,
            role: "recruiter" as const,
            passwordHash: hash,
            active: true,
          };
          addUser(newUser);

          const sessionToken = crypto.randomUUID();
          const s = saveSession(newUser.id, newUser.name, newUser.email, newUser.role, sessionToken);
          setSession(s);
          return { success: true };
        } catch (e) {
          return { success: false, error: "Signup error: " + (e instanceof Error ? e.message : "unknown") };
        }
      } else {
        return { success: false, error: "Supabase is not configured. Contact the administrator." };
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const normalizedEmail = email.trim();

      if (!normalizedEmail.toLowerCase().endsWith("@huntsmenbarons.com")) {
        return { success: false, error: "Please use your @huntsmenbarons.com company email." };
      }

      const rateLimit = getRateLimit(normalizedEmail);
      if (!rateLimit.allowed) {
        const seconds = Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000);
        return { success: false, error: `Too many failed attempts. Try again in ${seconds}s.` };
      }

      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (error) throw error;
          if (!data.user) throw new Error("No user returned");

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("display_name, role, active")
            .eq("id", data.user.id)
            .maybeSingle();

          if (profileError) {
            throw new Error(profileError.message);
          }

          if (profile?.active === false) {
            await supabase.auth.signOut();
            recordFailedAttempt(normalizedEmail);
            return { success: false, error: "Your account has been deactivated. Contact admin." };
          }

          clearRateLimit(normalizedEmail);
          const sessionToken = crypto.randomUUID();
          const tabId = crypto.randomUUID();

          // Register session server-side (blocking — ensures token exists before middleware check)
          try {
            await fetch("/api/auth/register-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: data.user.id, sessionToken, tabId }),
            });
          } catch {
            // Graceful degradation — login still works, session limit unenforced until next page load
          }

          const s = saveSession(data.user.id, profile?.display_name || data.user.email?.split("@")[0] || "User", data.user.email!, (profile?.role as Role) || "recruiter", sessionToken);
          setSession(s);
          return { success: true };
        } catch (e) {
          recordFailedAttempt(normalizedEmail);
          return { success: false, error: "Incorrect email or password." };
        }
      } else if (process.env.NEXT_PUBLIC_DEV_AUTH === "true") {
        try {
          await initUsersIfEmpty();
          const user = findUserByEmail(normalizedEmail);
          if (!user) {
            recordFailedAttempt(normalizedEmail);
            return { success: false, error: "No account found for this email address." };
          }
          if (!user.active) {
            recordFailedAttempt(normalizedEmail);
            return { success: false, error: "Your account has been deactivated. Contact admin." };
          }

          const ok = await verifyPassword(user, password);
          if (!ok) {
            recordFailedAttempt(normalizedEmail);
            return { success: false, error: "Incorrect email or password." };
          }

          clearRateLimit(normalizedEmail);
          const sessionToken = crypto.randomUUID();
          const s = saveSession(user.id, user.name, user.email, user.role, sessionToken);
          setSession(s);
          return { success: true };
        } catch (e) {
          recordFailedAttempt(normalizedEmail);
          return { success: false, error: "Login error: " + (e instanceof Error ? e.message : "unknown") };
        }
      } else {
        return { success: false, error: "Supabase is not configured. Contact the administrator." };
      }
    },
    []
  );

  const logout = useCallback(() => {
    const currentSession = session;
    const supabase = getBrowserSupabaseClient();
    if (supabase) {
      if (currentSession?.sessionToken) {
        navigator.sendBeacon("/api/auth/unregister-session", JSON.stringify({ sessionToken: currentSession.sessionToken }));
      }
      supabase.auth.signOut().then(() => {
        setSession(null);
        router.push("/login");
      });
    } else {
      clearSession();
      setSession(null);
      router.push("/login");
    }
  }, [router, session]);

  return <AuthContext.Provider value={{ session, isLoading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
