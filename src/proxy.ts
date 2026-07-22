import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/env";

const SESSION_KEY = "ats_session";

function isLocalSessionAuthenticated(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_KEY)?.value;
  if (!sessionCookie) {
    return false;
  }

  try {
    const decoded = decodeURIComponent(sessionCookie);
    const data = JSON.parse(decoded) as { expiresAt: number };
    return Date.now() < data.expiresAt;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/dashboard");
  const isLoginPage = pathname.startsWith("/login");
  const supabaseConfig = getSupabaseConfig();

  if (!supabaseConfig) {
    const isAuthenticated = isLocalSessionAuthenticated(request);

    if (isProtected && !isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isLoginPage && isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  const cookiesToSet: Array<{ name: string; value: string; options?: any }> = [];
  const supabase = createSupabaseServerClient({
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookies) {
      cookiesToSet.push(...cookies);
    },
  });

  if (!supabase) {
    return NextResponse.next();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isActive = true;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("active")
      .eq("id", user.id)
      .maybeSingle();
    isActive = (profile as { active?: boolean } | null)?.active !== false;
  }

  // Sign out before creating the response so sign-out cookies enter cookiesToSet
  if (isProtected && user && !isActive) {
    await supabase.auth.signOut();
  }

  const response = isProtected && (!user || !isActive)
    ? NextResponse.redirect(new URL("/login", request.url))
    : isLoginPage && user && isActive
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();

  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;

}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
