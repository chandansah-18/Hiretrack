"use server";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { requireAuth, AuthError } from "@/lib/auth/server-session";

export async function getSupabaseAdminClient() {
  const config = getSupabaseConfig();
  if (!config || !config.url || !config.serviceRoleKey) {
    return null;
  }
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function fetchUsersAction() {
  try {
    await requireAuth("admin");
  } catch (e) {
    return { success: false, error: e instanceof AuthError ? e.message : "Not authorized" };
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) return { success: false, error: "Supabase not configured" };

  try {
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) throw error;
    
    // We also need the profiles
    const { data: profiles, error: profileError } = await admin
      .from("profiles")
      .select("*");
      
    if (profileError) throw profileError;

    const users = data.users.map((u) => {
      const profile = profiles?.find((p) => p.id === u.id);
      return {
        id: u.id,
        email: u.email || "",
        name: profile?.display_name || u.email?.split("@")[0] || "User",
        role: profile?.role || "recruiter",
        active: profile?.active !== false,
      };
    });

    return { success: true, users };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createUserAction(payload: { email: string; name: string; role: string; password?: string }) {
  try {
    await requireAuth("admin");
  } catch (e) {
    return { success: false, error: e instanceof AuthError ? e.message : "Not authorized" };
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) return { success: false, error: "Supabase not configured" };

  try {
    if (!payload.email.toLowerCase().endsWith("@huntsmenbarons.com")) {
      return { success: false, error: "Email must be a @huntsmenbarons.com address" };
    }

    if (!payload.password || payload.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    const password = payload.password;

    // 1. Create auth user
    const { data: userData, error: userError } = await admin.auth.admin.createUser({
      email: payload.email,
      password: password,
      email_confirm: true,
    });
    if (userError) throw userError;

    const userId = userData.user.id;

    // 2. Create profile
    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      display_name: payload.name,
      role: payload.role,
      active: true,
    });

    if (profileError) {
      // Rollback
      await admin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    const recruiterId = `rec-${userId.replace(/-/g, "").slice(0, 12)}`;
    const { error: recruiterError } = await admin.from("recruiters").upsert({
      id: recruiterId,
      name: payload.name,
      email: payload.email.toLowerCase(),
      vertical: "General",
      target: 0,
      active: true,
      can_edit: true,
    });

    if (recruiterError) {
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
      throw recruiterError;
    }

    return { success: true, userId };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateUserAction(userId: string, payload: { name?: string; role?: string; active?: boolean; password?: string }) {
  try {
    await requireAuth("admin");
  } catch (e) {
    return { success: false, error: e instanceof AuthError ? e.message : "Not authorized" };
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) return { success: false, error: "Supabase not configured" };

  try {
    if (payload.password) {
      const { error } = await admin.auth.admin.updateUserById(userId, { password: payload.password });
      if (error) throw error;
    }

    const updates: Record<string, string | boolean> = {};
    if (payload.name !== undefined) updates.display_name = payload.name;
    if (payload.role !== undefined) updates.role = payload.role;
    if (payload.active !== undefined) updates.active = payload.active;

    if (Object.keys(updates).length > 0) {
      const { error } = await admin.from("profiles").update(updates).eq("id", userId);
      if (error) throw error;
    }

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await requireAuth("admin");
  } catch (e) {
    return { success: false, error: e instanceof AuthError ? e.message : "Not authorized" };
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) return { success: false, error: "Supabase not configured" };

  try {
    // 1. Delete profile (some databases do this automatically with cascading deletes)
    await admin.from("profiles").delete().eq("id", userId);
    
    // 2. Delete auth user
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function exportSupabaseBackupAction() {
  try {
    await requireAuth("admin");
  } catch (e) {
    return { success: false as const, error: e instanceof AuthError ? e.message : "Not authorized" };
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) return { success: false as const, error: "Supabase not configured" };

  try {
    const tables = [
      "profiles",
      "recruiters",
      "clients",
      "spocs",
      "positions",
      "candidates",
      "interviews",
      "offers",
      "joinings",
      "cv_shared_entries",
      "leaves",
      "activity_log",
    ] as const;

    const entries = await Promise.all(
      tables.map(async (table) => {
        const { data, error } = await admin.from(table).select("*");
        if (error) throw error;
        return [table, data ?? []] as const;
      })
    );

    const dashboard = Object.fromEntries(entries);
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (authError) throw authError;

    return {
      success: true as const,
      backup: {
        exportedAt: new Date().toISOString(),
        source: "supabase",
        dashboard,
        users: (authUsers.users ?? []).map((u) => ({
          id: u.id,
          email: u.email,
          createdAt: u.created_at,
        })),
      },
    };
  } catch (e: unknown) {
    return { success: false as const, error: e instanceof Error ? e.message : "Backup failed" };
  }
}

export async function getStorageStatsAction() {
  try {
    await requireAuth("admin");
  } catch (e) {
    return { success: false as const, error: e instanceof AuthError ? e.message : "Not authorized" };
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) return { success: false as const, error: "Supabase not configured" };

  try {
    const { data, error } = await admin.rpc("get_dashboard_storage_stats");
    if (error) throw error;
    return { success: true as const, stats: data as Record<string, unknown> };
  } catch (e: unknown) {
    // Fallback counts when RPC migration is not applied yet
    try {
      const [candidates, interviews, positions] = await Promise.all([
        admin.from("candidates").select("id", { count: "exact", head: true }),
        admin.from("interviews").select("id", { count: "exact", head: true }),
        admin.from("positions").select("id", { count: "exact", head: true }),
      ]);
      return {
        success: true as const,
        stats: {
          databaseBytes: null,
          candidates: candidates.count ?? 0,
          interviews: interviews.count ?? 0,
          positions: positions.count ?? 0,
          note: "Run the latest migration to enable full storage breakdown.",
        },
      };
    } catch {
      return { success: false as const, error: e instanceof Error ? e.message : "Failed to load storage stats" };
    }
  }
}

export async function archiveOldDataAction(beforeDate: string) {
  try {
    await requireAuth("admin");
  } catch (e) {
    return { success: false as const, error: e instanceof AuthError ? e.message : "Not authorized" };
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) return { success: false as const, error: "Supabase not configured" };

  try {
    const { data, error } = await admin.rpc("archive_closed_candidates", { before_date: beforeDate });
    if (error) throw error;
    return { success: true as const, result: data as Record<string, unknown> };
  } catch (e: unknown) {
    return { success: false as const, error: e instanceof Error ? e.message : "Archive failed" };
  }
}

export async function purgeArchivedDataAction(beforeDate: string) {
  try {
    await requireAuth("admin");
  } catch (e) {
    return { success: false as const, error: e instanceof AuthError ? e.message : "Not authorized" };
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) return { success: false as const, error: "Supabase not configured" };

  try {
    const { data, error } = await admin.rpc("purge_archived_candidates", { before_date: beforeDate });
    if (error) throw error;
    return { success: true as const, result: data as Record<string, unknown> };
  } catch (e: unknown) {
    return { success: false as const, error: e instanceof Error ? e.message : "Purge failed" };
  }
}
