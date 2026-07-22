import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth/server-session";
import { getSupabaseAdminClient } from "@/app/dashboard/admin/actions";

const MAX_SESSIONS = 5;

export async function POST(request: Request) {
  let authUser: { userId: string; email: string };
  try {
    authUser = await requireAuth();
  } catch (e) {
    return NextResponse.json({ error: e instanceof AuthError ? e.message : "Not authenticated" }, { status: 401 });
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      userId?: string;
      sessionToken?: string;
      tabId?: string;
    };

    const { sessionToken, tabId } = body;
    // Always bind the session to the authenticated user — ignore mismatched client userId
    const userId = authUser.userId;

    if (body.userId && body.userId !== authUser.userId) {
      return NextResponse.json({ error: "userId does not match authenticated session" }, { status: 403 });
    }

    if (!userId || !sessionToken || !tabId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") ?? "";
    const ipAddress = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "";

    await admin
      .from("user_sessions")
      .delete()
      .eq("user_id", userId)
      .lt("last_seen_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count } = await admin
      .from("user_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("last_seen_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const activeCount = count ?? 0;

    if (activeCount >= MAX_SESSIONS) {
      const { data: oldest } = await admin
        .from("user_sessions")
        .select("id")
        .eq("user_id", userId)
        .order("last_seen_at", { ascending: true })
        .limit(1);

      if (oldest && oldest.length > 0) {
        await admin.from("user_sessions").delete().eq("id", oldest[0].id);
      }
    }

    const { error: insertError } = await admin.from("user_sessions").insert({
      user_id: userId,
      session_token: sessionToken,
      tab_id: tabId,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to register session" }, { status: 500 });
  }
}
