import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

let adminClient: any = null;

export function getSupabaseAdminClient(): any {
  const config = getSupabaseConfig();
  if (!config?.serviceRoleKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}
