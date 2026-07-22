import { createSeedState } from "./seed";
import type { DashboardState } from "./types";
import { loadDashboardState, saveDashboardState } from "./storage";

export async function loadLocalDashboardState() {
  if (typeof window === "undefined") {
    return createSeedState();
  }

  return loadDashboardState();
}

export async function saveLocalDashboardState(state: DashboardState) {
  saveDashboardState(state);
}

