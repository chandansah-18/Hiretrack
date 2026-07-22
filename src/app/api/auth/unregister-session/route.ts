import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server-session";
import { getSupabaseAdminClient } from "@/app/dashboard/admin/actions";

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = await getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const { sessionToken } = await request.json() as { sessionToken: string };

    if (!sessionToken) {
      return NextResponse.json({ error: "Missing sessionToken" }, { status: 400 });
    }

    await admin.from("user_sessions").delete().eq("session_token", sessionToken);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to unregister session" }, { status: 500 });
  }
}
