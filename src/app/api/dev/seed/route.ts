import { NextResponse } from "next/server";
import { createSeedState } from "@/lib/data/seed";
import { saveDashboardStateToSupabase } from "@/lib/data/supabase-persistence";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const DEMO_USERS = [
  { email: "chandan.sah@huntsmenbarons.com", displayName: "Chandan Sah", role: "admin", password: "dev-seed-ats-1" },
  { email: "aman.singh@huntsmenbarons.com", displayName: "Aman Singh", role: "recruiter", password: "dev-seed-ats-2" },
  { email: "riya.kapoor@huntsmenbarons.com", displayName: "Riya Kapoor", role: "recruiter", password: "dev-seed-ats-3" },
  { email: "arjun.patel@huntsmenbarons.com", displayName: "Arjun Patel", role: "recruiter", password: "dev-seed-ats-4" },
  { email: "neha.rao@huntsmenbarons.com", displayName: "Neha Rao", role: "recruiter", password: "dev-seed-ats-5" },
] as const;

type DemoUser = (typeof DEMO_USERS)[number];
type ListedUser = { id: string; email?: string | null };

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Seeding is disabled in production." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set the Supabase env vars before using the seed endpoint.",
      },
      { status: 400 }
    );
  }

  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
  const existingEmails = new Set<string>();

  if (!listError && existingUsers?.users) {
    for (const user of existingUsers.users as ListedUser[]) {
      if (user.email) {
        existingEmails.add(user.email.toLowerCase());
      }
    }
  }

  const createdUsers = new Map<string, string>();

  for (const user of DEMO_USERS as readonly DemoUser[]) {
    if (existingEmails.has(user.email.toLowerCase())) {
      continue;
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.displayName,
        name: user.displayName,
        role: user.role,
      },
    });

    if (createError) {
      const message =
        createError.message && createError.message !== "{}"
          ? createError.message
          : "Auth database error for this email. Run POST /api/dev/repair-auth first.";
      return NextResponse.json({ error: message, email: user.email }, { status: 500 });
    }

    if (created?.user?.id) {
      createdUsers.set(user.email.toLowerCase(), created.user.id);
      existingEmails.add(user.email.toLowerCase());
    }
  }

  const { data: refreshedUsers, error: refreshError } = await admin.auth.admin.listUsers();
  const authUsersByEmail = new Map<string, string>(createdUsers);

  if (!refreshError && refreshedUsers?.users) {
    for (const user of refreshedUsers.users as ListedUser[]) {
      if (user.email && user.id) {
        authUsersByEmail.set(user.email.toLowerCase(), user.id);
      }
    }
  }

  if (authUsersByEmail.size === 0) {
    return NextResponse.json(
      {
        error:
          "Could not resolve auth users. Run POST /api/dev/repair-auth to recreate demo logins, then seed again.",
      },
      { status: 500 }
    );
  }

  const profiles = DEMO_USERS.flatMap((user) => {
    const userId = authUsersByEmail.get(user.email.toLowerCase());
    if (!userId) {
      return [];
    }

    return [
      {
        id: userId,
        display_name: user.displayName,
        role: user.role,
        active: true,
      },
    ];
  });

  if (profiles.length > 0) {
    const { error: profileError } = await admin.from("profiles").upsert(profiles, { onConflict: "id" });
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  const seedState = createSeedState();

  const demoRecruiters = DEMO_USERS.map((user) => {
    const userId = authUsersByEmail.get(user.email.toLowerCase());
    return {
      id: userId ? `rec-${userId.replace(/-/g, "").slice(0, 12)}` : `rec-${user.email.split("@")[0]}`,
      name: user.displayName,
      email: user.email.toLowerCase(),
      vertical: user.role === "admin" ? "General" : "Technology",
      target: 0,
      active: true,
      canEdit: true,
    };
  });

  for (const recruiter of demoRecruiters) {
    const existingIndex = seedState.recruiters.findIndex(
      (item) =>
        item.email.toLowerCase() === recruiter.email.toLowerCase() ||
        item.name.toLowerCase() === recruiter.name.toLowerCase()
    );
    if (existingIndex >= 0) {
      seedState.recruiters[existingIndex] = {
        ...seedState.recruiters[existingIndex],
        name: recruiter.name,
        email: recruiter.email,
        active: true,
      };
    } else {
      seedState.recruiters.push(recruiter);
    }
  }

  await saveDashboardStateToSupabase(admin, seedState);

  const response = NextResponse.json({
    ok: true,
    users: profiles.length,
    clients: seedState.clients.length,
    positions: seedState.positions.length,
    candidates: seedState.candidates.length,
    interviews: seedState.interviews.length,
  });
  response.cookies.set("dashboard-seed-ts", String(Date.now()), {
    path: "/",
    maxAge: 60,
    sameSite: "lax",
  });
  return response;
}
