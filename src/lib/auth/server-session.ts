import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Role } from "@/lib/data/types";

export class AuthError extends Error {
  constructor(message: string, public code: "UNAUTHENTICATED" | "UNAUTHORIZED" = "UNAUTHORIZED") {
    super(message);
  }
}

export async function requireAuth(requiredRole?: Role) {
  const supabaseConfig = getSupabaseConfig();

  if (supabaseConfig) {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient({
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    });
    if (!supabase) throw new AuthError("Auth unavailable", "UNAUTHENTICATED");

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new AuthError("Not authenticated", "UNAUTHENTICATED");

    if (requiredRole) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile || profile.role !== requiredRole) throw new AuthError("Not authorized");
    }

    return { userId: user.id, email: user.email ?? "" };
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get("ats_session")?.value;
  if (!raw) throw new AuthError("Not authenticated", "UNAUTHENTICATED");

  try {
    const data = JSON.parse(decodeURIComponent(raw)) as { userId: string; email: string; role: Role; expiresAt: number };
    if (Date.now() > data.expiresAt) throw new AuthError("Session expired", "UNAUTHENTICATED");
    if (requiredRole && data.role !== requiredRole) throw new AuthError("Not authorized");
    return { userId: data.userId, email: data.email };
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw new AuthError("Invalid session", "UNAUTHENTICATED");
  }
}
