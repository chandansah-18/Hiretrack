import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const DEMO_USERS = [
  { email: "chandan.sah@huntsmenbarons.com", displayName: "Chandan Sah", role: "admin", password: "dev-repair-ats-1" },
  { email: "aman.singh@huntsmenbarons.com", displayName: "Aman Singh", role: "recruiter", password: "dev-repair-ats-2" },
  { email: "riya.kapoor@huntsmenbarons.com", displayName: "Riya Kapoor", role: "recruiter", password: "dev-repair-ats-3" },
  { email: "arjun.patel@huntsmenbarons.com", displayName: "Arjun Patel", role: "recruiter", password: "dev-repair-ats-4" },
  { email: "neha.rao@huntsmenbarons.com", displayName: "Neha Rao", role: "recruiter", password: "dev-repair-ats-5" },
] as const;

const REPAIR_SQL = `-- Run this in Supabase Dashboard -> SQL Editor, then POST /api/dev/repair-auth again
begin;

delete from auth.identities
where user_id in (
  select id from auth.users
  where lower(email) in (
    'chandan.sah@huntsmenbarons.com',
    'aman.singh@huntsmenbarons.com',
    'riya.kapoor@huntsmenbarons.com',
    'arjun.patel@huntsmenbarons.com',
    'neha.rao@huntsmenbarons.com'
  )
);

delete from auth.users
where lower(email) in (
  'chandan.sah@huntsmenbarons.com',
  'aman.singh@huntsmenbarons.com',
  'riya.kapoor@huntsmenbarons.com',
  'arjun.patel@huntsmenbarons.com',
  'neha.rao@huntsmenbarons.com'
);

delete from public.profiles
where lower(display_name) in (
  'chandan sah',
  'aman singh',
  'riya kapoor',
  'arjun patel',
  'neha rao'
);

commit;`;

function authErrorMessage(error: { message?: string } | null) {
  if (!error?.message || error.message === "{}") {
    return "Supabase auth database error (corrupted auth.users row). Run the repair SQL first.";
  }
  return error.message;
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Repair is disabled in production." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY. Set Supabase env vars before repairing auth." },
      { status: 400 }
    );
  }

  const results: Array<{ email: string; status: string; userId?: string; error?: string }> = [];

  for (const user of DEMO_USERS) {
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .ilike("display_name", user.displayName)
      .maybeSingle();

    if (existingProfile?.id) {
      await admin.from("profiles").delete().eq("id", existingProfile.id);
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.displayName,
        name: user.displayName,
        role: user.role,
      },
    });

    if (error) {
      results.push({ email: user.email, status: "failed", error: authErrorMessage(error) });
      continue;
    }

    const userId = data.user.id;
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        display_name: user.displayName,
        role: user.role,
        active: true,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      results.push({ email: user.email, status: "failed", error: profileError.message });
      continue;
    }

    results.push({ email: user.email, status: "created", userId });
  }

  const failed = results.filter((item) => item.status === "failed");
  if (failed.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        repaired: results.filter((item) => item.status === "created").length,
        failed,
        repairSql: REPAIR_SQL,
        nextStep:
          "Open Supabase Dashboard -> SQL Editor, run repairSql, then POST /api/dev/repair-auth again.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    users: results.length,
    results,
    loginHint: "Sign in with any demo email above (dev-only passwords).",
  });
}
