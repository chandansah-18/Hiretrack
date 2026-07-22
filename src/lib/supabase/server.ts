import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

export type SupabaseCookieStore = Pick<CookieMethodsServer, "getAll" | "setAll">;

export function createSupabaseServerClient(cookies: SupabaseCookieStore) {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  return createServerClient(config.url, config.anonKey, {
    cookies,
    cookieEncoding: "base64url",
  });
}
