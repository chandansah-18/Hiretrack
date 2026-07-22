import { createSeedState } from "./seed";
import type { DashboardState, Position } from "./types";

const STORAGE_KEY = "recruitment-operations-dashboard-state";
export const DASHBOARD_STORAGE_EVENT = "recruitment-operations-dashboard-storage";
const DEBOUNCE_MS = 500;
let cachedRawState: string | null = null;
let cachedParsedState: DashboardState = createSeedState();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: DashboardState | null = null;

function readRawState() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEY);
}

export function loadDashboardState(): DashboardState {
  if (typeof window === "undefined") {
    return cachedParsedState;
  }

  const raw = readRawState();
  if (raw === cachedRawState) {
    return cachedParsedState;
  }

  if (!raw) {
    cachedRawState = null;
    cachedParsedState = createSeedState();
    return cachedParsedState;
  }

  try {
    cachedRawState = raw;
    const parsed = JSON.parse(raw) as DashboardState;
    const rawPositions: unknown[] = parsed.positions ?? [];
    const migratedPositions: Position[] = rawPositions.map((p) => {
      const item = p as Record<string, unknown>;
      const { manualCvCount: _unused, ...clean } = item;
      return {
        ...clean,
        location: Array.isArray(clean.location)
          ? clean.location
          : typeof clean.location === "string" && clean.location
            ? [clean.location]
            : [],
        openings: typeof clean.openings === "number" ? clean.openings : 1,
        ctc: typeof clean.ctc === "number" ? clean.ctc : 0,
      } as unknown as Position;
    });
    const migratedCandidates = parsed.candidates.map((c) => ({
      ...c,
      emailId: (c as unknown as Record<string, unknown>).emailId ?? "",
      currentCtc: (c as unknown as Record<string, unknown>).currentCtc ?? 0,
      expectedCtc: (c as unknown as Record<string, unknown>).expectedCtc ?? 0,
      noticePeriod: (c as unknown as Record<string, unknown>).noticePeriod ?? "",
      currentCompany: (c as unknown as Record<string, unknown>).currentCompany ?? "",
      experience: (c as unknown as Record<string, unknown>).experience ?? 0,
      location: (c as unknown as Record<string, unknown>).location ?? "",
      requisitionId: (c as unknown as Record<string, unknown>).requisitionId ?? "",
      finalSelectDate: (c as unknown as Record<string, unknown>).finalSelectDate ?? "",
      finalSelectStatus: (c as unknown as Record<string, unknown>).finalSelectStatus ?? "Document Pending",
      holdingOfferCtc: (c as unknown as Record<string, unknown>).holdingOfferCtc ?? 0,
      holdingOfferCompany: (c as unknown as Record<string, unknown>).holdingOfferCompany ?? "",
      holdingOfferDoj: (c as unknown as Record<string, unknown>).holdingOfferDoj ?? "",
    }));

    const migratedOffers = (parsed.offers ?? []).map((o) => ({
      ...o,
      billValue: (o as unknown as Record<string, unknown>).billValue ?? 0,
      selectionStatus: (o as unknown as Record<string, unknown>).selectionStatus ?? "Joining Pending",
    }));

    cachedParsedState = {
      ...parsed,
      clients: parsed.clients ?? [],
      spocs: parsed.spocs ?? [],
      recruiters: parsed.recruiters ?? [],
      positions: migratedPositions,
      candidates: migratedCandidates as typeof parsed.candidates,
      interviews: parsed.interviews ?? [],
      offers: migratedOffers as typeof parsed.offers,
      joinings: parsed.joinings ?? [],
      cvSharedEntries: parsed.cvSharedEntries ?? [],
      leaves: parsed.leaves ?? [],
      activityLog: parsed.activityLog ?? [],
      currentUserRole: parsed.currentUserRole ?? "admin",
      currentUserName: parsed.currentUserName ?? "",
    };
    return cachedParsedState;
  } catch {
    cachedRawState = null;
    cachedParsedState = createSeedState();
    return cachedParsedState;
  }
}

function flushStorage() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (pendingState) {
    cachedParsedState = pendingState;
    cachedRawState = JSON.stringify(pendingState);
    pendingState = null;
    try {
      window.localStorage.setItem(STORAGE_KEY, cachedRawState);
      window.dispatchEvent(new Event(DASHBOARD_STORAGE_EVENT));
    } catch { /* ignore quota errors */ }
  }
}

export function saveDashboardState(state: DashboardState) {
  if (typeof window === "undefined") {
    return;
  }
  pendingState = state;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushStorage, DEBOUNCE_MS);
}

// Flush pending writes on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushStorage);
}
