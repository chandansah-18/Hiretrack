import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardTableName, DirtyRowIds } from "./mutations";
import type { DashboardState } from "./types";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { loadLocalDashboardState, saveLocalDashboardState } from "./local-persistence";
import {
  loadDashboardStateFromSupabase,
  reloadDashboardTablesFromSupabase,
  saveDashboardStateToSupabase,
} from "./supabase-persistence";

export interface DashboardPersistence {
  load: (userId?: string) => Promise<DashboardState>;
  loadTables: (
    tables: Array<DashboardTableName | "profiles">,
    userId?: string
  ) => Promise<Partial<DashboardState>>;
  save: (
    state: DashboardState,
    dirtyTables?: Set<DashboardTableName>,
    previousState?: DashboardState,
    dirtyIds?: DirtyRowIds
  ) => Promise<void>;
  isSupabase: boolean;
  client: SupabaseClient | null;
}

export function createDashboardPersistence(): DashboardPersistence {
  const client = getBrowserSupabaseClient();

  if (!client) {
    return {
      isSupabase: false,
      client: null,
      load: async () => loadLocalDashboardState(),
      loadTables: async () => ({}),
      save: async (state) => {
        await saveLocalDashboardState(state);
      },
    };
  }

  return {
    isSupabase: true,
    client,
    load: async (userId?: string) => loadDashboardStateFromSupabase(client, userId),
    loadTables: async (tables, userId) => reloadDashboardTablesFromSupabase(client, tables, userId),
    save: async (state, dirtyTables, previousState, dirtyIds) => {
      await saveDashboardStateToSupabase(client, state, dirtyTables, previousState, dirtyIds);
    },
  };
}
