import type { DashboardState } from "./types";

const CACHE_KEY = "hiretrack-dashboard-cache-v1";
const DEBOUNCE_MS = 1000;

export interface CachedDashboardData {
  userId: string;
  ts: number;
  state: DashboardState;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pending: { userId: string; state: DashboardState } | null = null;

export function readCachedDashboardState(): CachedDashboardData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedDashboardData;
  } catch {
    return null;
  }
}

function flushCache() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (pending) {
    try {
      const payload: CachedDashboardData = { userId: pending.userId, ts: Date.now(), state: pending.state };
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Quota exceeded — cache is best-effort
    }
    pending = null;
  }
}

export function writeCachedDashboardState(userId: string, state: DashboardState) {
  if (typeof window === "undefined" || !userId) return;
  pending = { userId, state };
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushCache, DEBOUNCE_MS);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushCache);
}
