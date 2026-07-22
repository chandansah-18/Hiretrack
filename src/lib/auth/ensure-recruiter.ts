"use server";

import { getSupabaseAdminClient } from "@/app/dashboard/admin/actions";
import { buildRecruiterIdForUser } from "@/lib/data/recruiters";

export async function ensureRecruiterProfileAction(payload: {
  userId: string;
  email: string;
  name: string;
}) {
  const admin = await getSupabaseAdminClient();
  if (!admin) {
    return { success: false as const, error: "Supabase not configured" };
  }

  const email = payload.email.trim().toLowerCase();
  const name = payload.name.trim();

  try {
    const { data: byEmail, error: emailLookupError } = await admin
      .from("recruiters")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (emailLookupError) {
      throw emailLookupError;
    }

    if (byEmail?.id) {
      return { success: true as const, recruiterId: byEmail.id };
    }

    const { data: byName, error: nameLookupError } = await admin
      .from("recruiters")
      .select("id, email")
      .ilike("name", name)
      .maybeSingle();

    if (nameLookupError) {
      throw nameLookupError;
    }

    if (byName?.id) {
      if (byName.email?.trim().toLowerCase() !== email) {
        const { error: updateError } = await admin
          .from("recruiters")
          .update({ email })
          .eq("id", byName.id);
        if (updateError) {
          throw updateError;
        }
      }
      return { success: true as const, recruiterId: byName.id };
    }

    const recruiterId = buildRecruiterIdForUser(payload.userId);
    const { error: insertError } = await admin.from("recruiters").upsert({
      id: recruiterId,
      name,
      email,
      vertical: "General",
      target: 0,
      active: true,
      can_edit: true,
    });

    if (insertError) {
      throw insertError;
    }

    return { success: true as const, recruiterId };
  } catch (e: unknown) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to ensure recruiter profile",
    };
  }
}
