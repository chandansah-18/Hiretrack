import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardTableName } from "./mutations";

export const DASHBOARD_STATE_CHANGED_EVENT = "recruitment-operations-dashboard-state-changed";
const BROADCAST_CHANNEL = "recruitment-operations-dashboard-sync";

const SUPABASE_DASHBOARD_TABLES: Array<DashboardTableName | "profiles"> = [
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
];

export type DashboardChangePayload = {
  tables: Array<DashboardTableName | "profiles">;
};

export function notifyDashboardStateChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(DASHBOARD_STATE_CHANGED_EVENT));

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.postMessage({ type: "changed" });
    channel.close();
  }
}

export function subscribeToDashboardStateChanges(onChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleEvent = () => onChange();
  window.addEventListener(DASHBOARD_STATE_CHANGED_EVENT, handleEvent);
  window.addEventListener("storage", handleEvent);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.onmessage = handleEvent;
  }

  return () => {
    window.removeEventListener(DASHBOARD_STATE_CHANGED_EVENT, handleEvent);
    window.removeEventListener("storage", handleEvent);
    channel?.close();
  };
}

export function subscribeToSupabaseDashboardChanges(
  client: SupabaseClient,
  onChange: (payload: DashboardChangePayload) => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let hasWarned = false;
  const pendingTables = new Set<DashboardTableName | "profiles">();

  const scheduleRefresh = (table: DashboardTableName | "profiles") => {
    pendingTables.add(table);
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      const tables = Array.from(pendingTables);
      pendingTables.clear();
      onChange({ tables });
    }, 250);
  };

  const channel = client.channel("dashboard-db-changes");

  for (const table of SUPABASE_DASHBOARD_TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => scheduleRefresh(table)
    );
  }

  void channel.subscribe((status) => {
    if ((status === "CHANNEL_ERROR" || status === "TIMED_OUT") && !hasWarned) {
      hasWarned = true;
      console.warn(
        "Supabase Realtime unavailable — live sync disabled. " +
          "Run the 'enable_realtime_publication' migration to enable it."
      );
    }
  });

  return () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    void client.removeChannel(channel);
  };
}
