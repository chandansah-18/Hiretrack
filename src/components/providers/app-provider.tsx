"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toaster, toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import {
  defaultFilters,
  type Candidate,
  type CandidateStage,
  type Client,
  type ClientSpoc,
  type DashboardFilters,
  type DashboardState,
  type FinalSelectStatus,
  type Interview,
  type InterviewStatus,
  type JoiningStatus,
  type LeaveType,
  type OfferStatus,
  type Position,
  type PositionStatus,
  type Recruiter,
  type Role,
  type SelectionOfferStatus,
} from "@/lib/data/types";
import { applyDashboardAction, computeDirtyRowIds, getAffectedTables, type DashboardAction, type DirtyRowIds } from "@/lib/data/mutations";
import { createSeedState } from "@/lib/data/seed";
import { createLookups } from "@/lib/data/selectors";
import { hasPermission } from "@/lib/data/permissions";
import { createDashboardPersistence } from "@/lib/data/persistence";
import { readCachedDashboardState, writeCachedDashboardState } from "@/lib/data/supabase-cache";
import { subscribeToDashboardStateChanges, subscribeToSupabaseDashboardChanges } from "@/lib/data/sync";
import type { DashboardTableName } from "@/lib/data/mutations";
import { createPrefixedId } from "@/lib/data/id";
import { buildRecruiterIdForUser, resolveRecruiterId } from "@/lib/data/recruiters";
import { generateCandidateId } from "@/lib/data/candidate-entry";
import { ensureRecruiterProfileAction } from "@/lib/auth/ensure-recruiter";
import { HOT_DATA_MONTHS } from "@/lib/data/supabase-persistence";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AppContextValue {
  state: DashboardState;
  filters: DashboardFilters;
  activeFilters: DashboardFilters;
  isLoading: boolean;
  loadError: string | null;
  saveStatus: SaveStatus;
  dataWindowMonths: number;
  setFilters: (patch: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  updateInterviewStatus: (payload: { interviewId: string; status: InterviewStatus; remarks: string }) => void;
  updateCandidateStage: (payload: { candidateId: string; stage: CandidateStage; remarks: string }) => void;
  updateOfferStatus: (payload: { offerId: string; status: OfferStatus; remarks: string }) => void;
  updateJoiningStatus: (payload: { joiningId: string; status: JoiningStatus; remarks: string; joiningDate?: string }) => void;
  updatePositionStatus: (payload: { positionId: string; status: PositionStatus; remarks: string }) => void;
  addPosition: (position: Omit<Position, "id">) => void;
  updatePositionAll: (payload: { positionId: string; position: Omit<Position, "id"> }) => void;
  deletePosition: (positionId: string) => void;
  addInterview: (interview: Omit<Interview, "id">) => void;
  updateInterviewAll: (payload: { interviewId: string; interview: Omit<Interview, "id"> }) => void;
  deleteInterview: (interviewId: string) => void;
  addCandidate: (candidate: Omit<Candidate, "id">, candidateId?: string) => string;
  updateCandidateAll: (payload: { candidateId: string; candidate: Omit<Candidate, "id"> }) => void;
  deleteCandidate: (candidateId: string) => void;
  currentRecruiterId: string;
  updateCvShared: (payload: { entryId: string; count: number }) => void;
  addCvShared: (payload: { clientId: string; month: string; count: number }) => void;
  updateFinalSelect: (payload: {
    candidateId: string;
    currentCtc: number;
    expectedCtc: number;
    noticePeriod: string;
    finalSelectDate: string;
    finalSelectStatus: FinalSelectStatus;
    remarks: string;
    holdingOfferCtc: number;
    holdingOfferCompany: string;
    holdingOfferDoj: string;
    billValue?: number;
    joiningDate?: string;
    offeredCtc?: number;
  }) => void;
  updateSelection: (payload: {
    offerId: string;
    candidateId: string;
    positionId: string;
    clientId: string;
    recruiterId: string;
    billValue: number;
    offerDate: string;
    joiningDate: string;
    selectionStatus: SelectionOfferStatus;
    remarks: string;
    holdingOfferCtc: number;
    holdingOfferCompany: string;
    holdingOfferDoj: string;
  }) => void;
  markLeave: (recruiterId: string, date: string, type: LeaveType | null) => void;
  setRole: (role: Role) => void;
  addRecruiter: (recruiter: Omit<Recruiter, "id">, recruiterId?: string) => void;
  updateRecruiter: (recruiterId: string, recruiter: Omit<Recruiter, "id">) => void;
  deleteRecruiter: (recruiterId: string) => void;
  addClient: (client: Omit<Client, "id">, clientId?: string) => void;
  updateClient: (clientId: string, client: Omit<Client, "id">) => void;
  deleteClient: (clientId: string) => void;
  addSpoc: (spoc: Omit<ClientSpoc, "id">, spocId?: string) => void;
  updateSpoc: (spocId: string, spoc: Omit<ClientSpoc, "id">) => void;
  deleteSpoc: (spocId: string) => void;
  can: (permission: Parameters<typeof hasPermission>[1]) => boolean;
  refreshState: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function describeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const maybeMessage = (error as Record<string, unknown>).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return "Failed to load dashboard state";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { session, isLoading: authLoading } = useAuth();
  const [filters, setFiltersState] = useState<DashboardFilters>(defaultFilters);
  const [state, setState] = useState<DashboardState>(() => createSeedState());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const hasAttemptedAutoCreate = useRef(new Set<string>());
  const persistence = useMemo(() => createDashboardPersistence(), []);
  const saveQueueRef = useRef(Promise.resolve());
  const pendingSavesRef = useRef(0);
  const saveEpochRef = useRef(0);
  const savedToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRemoteRefreshUntilRef = useRef(0);
  const refreshAfterSaveRef = useRef(false);

  const refreshState = useCallback(async () => {
    if (persistence.isSupabase && !session?.userId) {
      return;
    }

    try {
      const nextState = await persistence.load(session?.userId);
      setState(nextState);
      setLoadError(null);
      if (persistence.isSupabase && session?.userId) {
        writeCachedDashboardState(session.userId, nextState);
      }
    } catch (error) {
      const message = describeError(error);
      console.error("Failed to load dashboard state", message);
      setLoadError(message);
    }
  }, [persistence, session]);

  const refreshTables = useCallback(
    async (tables: Array<DashboardTableName | "profiles">) => {
      if (!persistence.isSupabase || !session?.userId || tables.length === 0) {
        return;
      }
      if (Date.now() < skipRemoteRefreshUntilRef.current) {
        return;
      }
      if (pendingSavesRef.current > 0) {
        refreshAfterSaveRef.current = true;
        return;
      }

      try {
        const patch = await persistence.loadTables(tables, session.userId);
        setState((current) => ({ ...current, ...patch }));
        setLoadError(null);
      } catch (error) {
        console.warn("Partial refresh failed, falling back to full reload", describeError(error));
        await refreshState();
      }
    },
    [persistence, refreshState, session?.userId]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (persistence.isSupabase && authLoading) {
        return;
      }

      if (persistence.isSupabase && !session?.userId) {
        if (!cancelled) {
          setState(createSeedState());
          setLoadError(null);
          setIsLoading(false);
        }
        return;
      }

      const cached = persistence.isSupabase ? readCachedDashboardState() : null;
      const hydratedFromCache = cached !== null && cached.userId === session?.userId;

      if (hydratedFromCache && cached) {
        if (!cancelled) {
          setState(cached.state);
          setLoadError(null);
          setIsLoading(false);
        }
      } else {
        setIsLoading(true);
      }

      try {
        const nextState = await persistence.load(session?.userId);
        if (!cancelled) {
          setState(nextState);
          if (persistence.isSupabase && session?.userId) {
            writeCachedDashboardState(session.userId, nextState);
          }
          setLoadError(null);
        }
      } catch (error) {
        const message = describeError(error);
        console.error("Failed to load dashboard state", message);
        if (!cancelled) {
          setLoadError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [authLoading, persistence, session?.userId]);

  useEffect(() => {
    if (persistence.isSupabase || !session) {
      return;
    }

    void (async () => {
      const patch = {
        currentUserName: session.name,
        currentUserRole: session.role,
      };
      setState((current) => {
        if (current.currentUserName === patch.currentUserName && current.currentUserRole === patch.currentUserRole) {
          return current;
        }
        const nextState = { ...current, ...patch };
        void persistence.save(nextState).catch((error) => {
          console.error("Failed to save local session sync", error);
        });
        return nextState;
      });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.name, session?.role, persistence]);

  useEffect(() => {
    return subscribeToDashboardStateChanges(() => {
      if (pendingSavesRef.current > 0) return;
      void refreshState();
    });
  }, [refreshState]);

  useEffect(() => {
    if (!persistence.isSupabase || !persistence.client) {
      return;
    }

    return subscribeToSupabaseDashboardChanges(persistence.client, ({ tables }) => {
      void refreshTables(tables);
    });
  }, [persistence.client, persistence.isSupabase, refreshTables]);

  useEffect(() => {
    const checkSeedCookie = () => {
      try {
        if (document.cookie.includes("dashboard-seed-ts=")) {
          document.cookie = "dashboard-seed-ts=; path=/; max-age=0";
          void refreshState();
        }
      } catch {
        // ignore
      }
    };
    checkSeedCookie();
    const interval = setInterval(checkSeedCookie, 3000);
    return () => clearInterval(interval);
  }, [refreshState]);

  useEffect(() => {
    if (!persistence.isSupabase || !loadError) {
      return;
    }

    const interval = setInterval(() => {
      void refreshState();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadError, persistence.isSupabase, refreshState]);

  useEffect(() => {
    return () => {
      if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
    };
  }, []);

  const commitAction = useCallback(
    (action: DashboardAction) => {
      if (persistence.isSupabase && loadError) {
        toast.error("Dashboard data is temporarily unavailable. Please refresh and try again.");
        return;
      }

      let previousState: DashboardState | null = null;
      let nextStateSnapshot: DashboardState | null = null;
      let dirtyTables = new Set<DashboardTableName>();
      let dirtyIds: DirtyRowIds = new Map();

      setState((current) => {
        previousState = current;
        const nextState = applyDashboardAction(current, action);
        nextStateSnapshot = nextState;
        dirtyTables = getAffectedTables(action);
        return nextState;
      });

      if (!previousState || !nextStateSnapshot) {
        return;
      }

      dirtyIds = computeDirtyRowIds(previousState, nextStateSnapshot, dirtyTables);

      pendingSavesRef.current += 1;
      setSaveStatus("saving");
      skipRemoteRefreshUntilRef.current = Date.now() + 1500;

      const prev = previousState;
      const next = nextStateSnapshot;
      const epoch = saveEpochRef.current;

      saveQueueRef.current = saveQueueRef.current
        .then(async () => {
          if (epoch !== saveEpochRef.current) {
            return;
          }
          await persistence.save(next, dirtyTables, prev, dirtyIds);
          if (persistence.isSupabase && session?.userId) {
            writeCachedDashboardState(session.userId, next);
          }
          if (epoch !== saveEpochRef.current) {
            return;
          }
          pendingSavesRef.current = Math.max(0, pendingSavesRef.current - 1);
          const needsRefresh = refreshAfterSaveRef.current;
          refreshAfterSaveRef.current = false;
          if (needsRefresh) {
            void refreshState();
          }
          if (pendingSavesRef.current === 0) {
            setSaveStatus("saved");
            if (savedToastTimerRef.current) clearTimeout(savedToastTimerRef.current);
            savedToastTimerRef.current = setTimeout(() => {
              setSaveStatus((status) => (status === "saved" ? "idle" : status));
            }, 2000);
          }
        })
        .catch(async (error: unknown) => {
          if (epoch !== saveEpochRef.current) {
            return;
          }
          saveEpochRef.current += 1;
          pendingSavesRef.current = 0;
          const errMsg =
            error && typeof error === "object"
              ? (error as Record<string, unknown>).message ?? JSON.stringify(error)
              : String(error);
          console.error("Failed to persist dashboard state:", errMsg);
          setSaveStatus("error");
          toast.error("Could not save changes — reloading the latest data. Please try again.");
          try {
            const latest = await persistence.load(session?.userId);
            setState(latest);
            setLoadError(null);
          } catch {
            setState(prev);
          }
        });
    },
    [loadError, persistence, session?.userId]
  );

  useEffect(() => {
    if (!session?.email || !session.userId) {
      return;
    }

    if (loadError) {
      return;
    }

    if (resolveRecruiterId(state.recruiters, session.email, session.name)) {
      return;
    }

    if (hasAttemptedAutoCreate.current.has(session.userId)) {
      return;
    }

    hasAttemptedAutoCreate.current.add(session.userId);

    if (persistence.isSupabase) {
      void ensureRecruiterProfileAction({
        userId: session.userId,
        email: session.email,
        name: session.name,
      }).then((result) => {
        if (result.success) {
          void refreshState();
        } else {
          console.error("Failed to ensure recruiter profile:", result.error);
        }
      });
      return;
    }

    queueMicrotask(() => {
      commitAction({
        kind: "add-recruiter",
        recruiter: {
          name: session.name,
          email: session.email,
          vertical: "General",
          target: 0,
          active: true,
          canEdit: true,
        },
        recruiterId: buildRecruiterIdForUser(session.userId),
        actorName: session.name,
      });
    });
  }, [
    session?.email,
    session?.name,
    session?.userId,
    loadError,
    state.recruiters,
    persistence.isSupabase,
    commitAction,
    refreshState,
  ]);

  const lookups = useMemo(() => createLookups(state), [state.clients, state.spocs, state.recruiters, state.positions, state.candidates, state.interviews, state.offers, state.joinings]);

  const value = useMemo<AppContextValue>(() => {
    const activeFilters = {
      ...filters,
      search: filters.search,
    };

    return {
      state,
      filters,
      activeFilters,
      isLoading,
      loadError,
      saveStatus,
      dataWindowMonths: HOT_DATA_MONTHS,
      setFilters: (patch) => {
        setFiltersState((current) => ({ ...current, ...patch }));
      },
      resetFilters: () => {
        setFiltersState(defaultFilters);
      },
      updateInterviewStatus: ({ interviewId, status, remarks }) => {
        commitAction({ kind: "update-interview", interviewId, status, remarks, actorName: state.currentUserName });
      },
      updateCandidateStage: ({ candidateId, stage, remarks }) => {
        commitAction({ kind: "update-candidate", candidateId, stage, remarks, actorName: state.currentUserName });
      },
      updateOfferStatus: ({ offerId, status, remarks }) => {
        commitAction({ kind: "update-offer", offerId, status, remarks, actorName: state.currentUserName });
      },
      updateJoiningStatus: ({ joiningId, status, remarks, joiningDate }) => {
        commitAction({ kind: "update-joining", joiningId, status, remarks, joiningDate, actorName: state.currentUserName });
      },
      updatePositionStatus: ({ positionId, status, remarks }) => {
        commitAction({ kind: "update-position", positionId, status, remarks, actorName: state.currentUserName });
      },
      addPosition: (position) => {
        commitAction({ kind: "add-position", position, actorName: state.currentUserName });
      },
      updatePositionAll: ({ positionId, position }) => {
        commitAction({ kind: "update-position-all", positionId, position, actorName: state.currentUserName });
      },
      deletePosition: (positionId) => {
        commitAction({ kind: "delete-position", positionId, actorName: state.currentUserName });
      },
      addInterview: (interview) => {
        const interviewId = createPrefixedId("int");
        commitAction({ kind: "add-interview", interview, interviewId, actorName: state.currentUserName });
      },
      updateInterviewAll: ({ interviewId, interview }) => {
        commitAction({ kind: "update-interview-all", interviewId, interview, actorName: state.currentUserName });
      },
      deleteInterview: (interviewId) => {
        commitAction({ kind: "delete-interview", interviewId, actorName: state.currentUserName });
      },
      addCandidate: (candidate, candidateId) => {
        const id = candidateId ?? generateCandidateId();
        commitAction({ kind: "add-candidate", candidate, candidateId: id, actorName: state.currentUserName });
        return id;
      },
      updateCandidateAll: ({ candidateId, candidate }) => {
        commitAction({ kind: "update-candidate-all", candidateId, candidate, actorName: state.currentUserName });
      },
      deleteCandidate: (candidateId) => {
        commitAction({ kind: "delete-candidate", candidateId, actorName: state.currentUserName });
      },
      currentRecruiterId: resolveRecruiterId(state.recruiters, session?.email, state.currentUserName),
      updateCvShared: ({ entryId, count }) => {
        commitAction({ kind: "update-cv-shared", entryId, count, actorName: state.currentUserName });
      },
      addCvShared: ({ clientId, month, count }) => {
        commitAction({ kind: "add-cv-shared", clientId, month, count, actorName: state.currentUserName });
      },
      updateFinalSelect: ({ candidateId, currentCtc, expectedCtc, noticePeriod, finalSelectDate, finalSelectStatus, remarks, holdingOfferCtc, holdingOfferCompany, holdingOfferDoj, billValue, joiningDate, offeredCtc }) => {
        commitAction({
          kind: "update-final-select",
          candidateId,
          currentCtc,
          expectedCtc,
          noticePeriod,
          finalSelectDate,
          finalSelectStatus,
          remarks,
          holdingOfferCtc,
          holdingOfferCompany,
          holdingOfferDoj,
          billValue,
          joiningDate,
          offeredCtc,
          actorName: state.currentUserName,
        });
      },
      updateSelection: ({ offerId, candidateId, positionId, clientId, recruiterId, billValue, offerDate, joiningDate, selectionStatus, remarks, holdingOfferCtc, holdingOfferCompany, holdingOfferDoj }) => {
        commitAction({
          kind: "update-selection",
          offerId,
          candidateId,
          positionId,
          clientId,
          recruiterId,
          billValue,
          offerDate,
          joiningDate,
          selectionStatus,
          remarks,
          holdingOfferCtc,
          holdingOfferCompany,
          holdingOfferDoj,
          actorName: state.currentUserName,
        });
      },
      markLeave: (recruiterId, date, type) => {
        commitAction({ kind: "mark-leave", recruiterId, date, type, actorName: state.currentUserName });
      },
      setRole: (role) => {
        commitAction({ kind: "set-role", role, actorName: state.currentUserName });
      },
      addRecruiter: (recruiter, recruiterId) => {
        commitAction({ kind: "add-recruiter", recruiter, recruiterId, actorName: state.currentUserName });
      },
      updateRecruiter: (recruiterId, recruiter) => {
        commitAction({ kind: "update-recruiter", recruiterId, recruiter, actorName: state.currentUserName });
      },
      deleteRecruiter: (recruiterId) => {
        commitAction({ kind: "delete-recruiter", recruiterId, actorName: state.currentUserName });
      },
      addClient: (client, clientId) => {
        commitAction({ kind: "add-client", client, clientId, actorName: state.currentUserName });
      },
      updateClient: (clientId, client) => {
        commitAction({ kind: "update-client", clientId, client, actorName: state.currentUserName });
      },
      deleteClient: (clientId) => {
        commitAction({ kind: "delete-client", clientId, actorName: state.currentUserName });
      },
      addSpoc: (spoc, spocId) => {
        commitAction({ kind: "add-spoc", spoc, spocId, actorName: state.currentUserName });
      },
      updateSpoc: (spocId, spoc) => {
        commitAction({ kind: "update-spoc", spocId, spoc, actorName: state.currentUserName });
      },
      deleteSpoc: (spocId) => {
        commitAction({ kind: "delete-spoc", spocId, actorName: state.currentUserName });
      },
      can: (permission) => hasPermission(state.currentUserRole, permission),
      refreshState: () => refreshState(),
    };
  }, [commitAction, filters, refreshState, state, session, isLoading, loadError, saveStatus]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toaster richColors position="top-right" />
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
