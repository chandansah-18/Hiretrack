import {
  type ActivityLog,
  type Candidate,
  type CandidateStage,
  type Client,
  type ClientSpoc,
  type DashboardState,
  type FinalSelectStatus,
  type Interview,
  type InterviewStatus,
  type JoiningStatus,
  type LeaveRecord,
  type LeaveType,
  type OfferStatus,
  type Position,
  type PositionStatus,
  type Recruiter,
  type Role,
  type SelectionOfferStatus,
} from "./types";
import { createPrefixedId } from "./id";

export type DashboardAction =
  | {
      kind: "set-role";
      role: Role;
      actorName: string;
    }
  | {
      kind: "update-interview";
      interviewId: string;
      status: InterviewStatus;
      remarks: string;
      actorName: string;
    }
  | {
      kind: "update-candidate";
      candidateId: string;
      stage: CandidateStage;
      remarks: string;
      actorName: string;
    }
  | {
      kind: "update-offer";
      offerId: string;
      status: OfferStatus;
      remarks: string;
      actorName: string;
    }
  | {
      kind: "update-joining";
      joiningId: string;
      status: JoiningStatus;
      remarks: string;
      actorName: string;
      joiningDate?: string;
    }
  | {
      kind: "update-position";
      positionId: string;
      status: PositionStatus;
      remarks: string;
      actorName: string;
    }
  | {
      kind: "update-cv-shared";
      entryId: string;
      count: number;
      actorName: string;
    }
  | {
      kind: "add-cv-shared";
      clientId: string;
      month: string;
      count: number;
      actorName: string;
    }
  | {
      kind: "add-position";
      position: Omit<Position, "id">;
      positionId?: string;
      actorName: string;
    }
  | {
      kind: "update-position-all";
      positionId: string;
      position: Omit<Position, "id">;
      actorName: string;
    }
  | {
      kind: "delete-position";
      positionId: string;
      actorName: string;
    }
  | {
      kind: "add-interview";
      interview: Omit<Interview, "id">;
      interviewId?: string;
      actorName: string;
    }
  | {
      kind: "update-interview-all";
      interviewId: string;
      interview: Omit<Interview, "id">;
      actorName: string;
    }
  | {
      kind: "delete-interview";
      interviewId: string;
      actorName: string;
    }
  | {
      kind: "add-candidate";
      candidate: Omit<Candidate, "id">;
      candidateId?: string;
      actorName: string;
    }
  | {
      kind: "add-recruiter";
      recruiter: Omit<Recruiter, "id">;
      recruiterId?: string;
      actorName: string;
    }
  | {
      kind: "update-candidate-all";
      candidateId: string;
      candidate: Omit<Candidate, "id">;
      actorName: string;
    }
  | {
      kind: "delete-candidate";
      candidateId: string;
      actorName: string;
    }
  | {
      kind: "update-final-select";
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
      actorName: string;
    }
  | {
      kind: "update-selection";
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
      actorName: string;
    }
  | {
      kind: "mark-leave";
      recruiterId: string;
      date: string;
      type: LeaveType | null;
      actorName: string;
    }
  | {
      kind: "update-recruiter";
      recruiterId: string;
      recruiter: Omit<Recruiter, "id">;
      actorName: string;
    }
  | {
      kind: "delete-recruiter";
      recruiterId: string;
      actorName: string;
    }
  | {
      kind: "add-client";
      client: Omit<Client, "id">;
      clientId?: string;
      actorName: string;
    }
  | {
      kind: "update-client";
      clientId: string;
      client: Omit<Client, "id">;
      actorName: string;
    }
  | {
      kind: "delete-client";
      clientId: string;
      actorName: string;
    }
  | {
      kind: "add-spoc";
      spoc: Omit<ClientSpoc, "id">;
      spocId?: string;
      actorName: string;
    }
  | {
      kind: "update-spoc";
      spocId: string;
      spoc: Omit<ClientSpoc, "id">;
      actorName: string;
    }
  | {
      kind: "delete-spoc";
      spocId: string;
      actorName: string;
    };

const ACTIVITY_LOG_RETENTION_DAYS = 30;

function appendActivity(
  state: DashboardState,
  details: {
    actorName: string;
    action: string;
    entityType: "position" | "candidate" | "interview" | "offer" | "joining" | "role" | "client" | "spoc" | "recruiter";
    entityId: string;
    entityName: string;
    description: string;
  }
) {
  const cutoff = Date.now() - ACTIVITY_LOG_RETENTION_DAYS * 86400000;
  return [
    {
      id: createPrefixedId("log"),
      timestamp: new Date().toISOString(),
      actorRole: state.currentUserRole,
      actorName: details.actorName,
      action: details.action,
      entityType: details.entityType,
      entityId: details.entityId,
      entityName: details.entityName,
      description: details.description,
    },
    ...state.activityLog.filter((entry) => new Date(entry.timestamp).getTime() > cutoff),
  ];
}

export function applyDashboardAction(state: DashboardState, action: DashboardAction) {
  switch (action.kind) {
    case "set-role":
      return {
        ...state,
        currentUserRole: action.role,
        currentUserName: action.actorName,
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Changed role",
          entityType: "role",
          entityId: action.role,
          entityName: action.actorName,
          description: `Switched active role to ${action.role}.`,
        }),
      };
    case "update-interview": {
      const interview = state.interviews.find((item) => item.id === action.interviewId);
      const candidate = interview ? state.candidates.find((item) => item.id === interview.candidateId) : undefined;
      if (!interview) {
        return state;
      }
      const updatedInterviews = state.interviews.map((item) =>
        item.id === action.interviewId ? { ...item, status: action.status, remarks: action.remarks } : item
      );
      let updatedCandidates = state.candidates;
      if (action.status === "Final Select") {
        const today = new Date().toISOString().slice(0, 10);
        updatedCandidates = state.candidates.map((c) =>
          c.id === interview.candidateId && c.stage !== "Final Selection"
            ? { ...c, stage: "Final Selection" as const, finalSelectDate: today, finalSelectStatus: "Document Pending" as const }
            : c
        );
      }
      return {
        ...state,
        interviews: updatedInterviews,
        candidates: updatedCandidates,
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated interview status",
          entityType: "interview",
          entityId: interview.id,
          entityName: candidate?.name ?? interview.id,
          description: `${candidate?.name ?? "Interview"} moved to ${action.status}. ${action.remarks}`.trim(),
        }),
      };
    }
    case "update-candidate": {
      const candidate = state.candidates.find((item) => item.id === action.candidateId);
      if (!candidate) {
        return state;
      }
      return {
        ...state,
        candidates: state.candidates.map((item) =>
          item.id === action.candidateId ? { ...item, stage: action.stage as never, remarks: action.remarks } : item
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated candidate stage",
          entityType: "candidate",
          entityId: candidate.id,
          entityName: candidate.name,
          description: `${candidate.name} moved to ${action.stage}. ${action.remarks}`.trim(),
        }),
      };
    }
    case "update-offer": {
      const offer = state.offers.find((item) => item.id === action.offerId);
      const candidate = offer ? state.candidates.find((item) => item.id === offer.candidateId) : undefined;
      if (!offer) {
        return state;
      }
      return {
        ...state,
        offers: state.offers.map((item) => (item.id === action.offerId ? { ...item, status: action.status, remarks: action.remarks } : item)),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated offer status",
          entityType: "offer",
          entityId: offer.id,
          entityName: candidate?.name ?? offer.id,
          description: `${candidate?.name ?? "Offer"} marked ${action.status}. ${action.remarks}`.trim(),
        }),
      };
    }
    case "update-joining": {
      const joining = state.joinings.find((item) => item.id === action.joiningId);
      const candidate = joining ? state.candidates.find((item) => item.id === joining.candidateId) : undefined;
      if (!joining) {
        return state;
      }
      return {
        ...state,
        joinings: state.joinings.map((item) =>
          item.id === action.joiningId
            ? { ...item, status: action.status, remarks: action.remarks, joiningDate: action.joiningDate ?? item.joiningDate }
            : item
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated joining status",
          entityType: "joining",
          entityId: joining.id,
          entityName: candidate?.name ?? joining.id,
          description: `${candidate?.name ?? "Joining"} moved to ${action.status}. ${action.remarks}`.trim(),
        }),
      };
    }
    case "update-position": {
      const position = state.positions.find((item) => item.id === action.positionId);
      if (!position) {
        return state;
      }
      return {
        ...state,
        positions: state.positions.map((item) =>
          item.id === action.positionId ? { ...item, status: action.status, remarks: action.remarks } : item
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated position status",
          entityType: "position",
          entityId: position.id,
          entityName: position.name,
          description: `${position.name} moved to ${action.status}. ${action.remarks}`.trim(),
        }),
      };
    }
    case "update-cv-shared": {
      return {
        ...state,
        cvSharedEntries: state.cvSharedEntries.map((entry) =>
          entry.id === action.entryId ? { ...entry, count: action.count } : entry
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated CV shared count",
          entityType: "candidate",
          entityId: action.entryId,
          entityName: action.entryId,
          description: `CV shared count updated to ${action.count}.`,
        }),
      };
    }
    case "add-cv-shared": {
      const newEntry = {
        id: createPrefixedId("cv"),
        clientId: action.clientId,
        month: action.month,
        count: action.count,
      };
      return {
        ...state,
        cvSharedEntries: [...state.cvSharedEntries, newEntry],
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Added CV shared entry",
          entityType: "candidate",
          entityId: newEntry.id,
          entityName: newEntry.id,
          description: `CV shared entry added for client ${action.clientId}, ${action.count} CVs.`,
        }),
      };
    }
    case "mark-leave": {
      const existingLeaves = state.leaves ?? [];
      if (action.type === null) {
        return {
          ...state,
          leaves: existingLeaves.filter((l) => !(l.recruiterId === action.recruiterId && l.date === action.date)),
          activityLog: appendActivity(state, {
            actorName: action.actorName,
            action: "Cleared leave record",
            entityType: "candidate",
            entityId: action.recruiterId,
            entityName: "",
            description: `Cleared leave for ${action.recruiterId} on ${action.date}.`,
          }),
        };
      }
      const existing = existingLeaves.find((l) => l.recruiterId === action.recruiterId && l.date === action.date);
      if (existing) {
        return {
          ...state,
          leaves: existingLeaves.map((l) =>
            l.id === existing.id ? { ...l, type: action.type as LeaveType, markedBy: action.actorName } : l
          ),
          activityLog: appendActivity(state, {
            actorName: action.actorName,
            action: "Updated leave record",
            entityType: "candidate",
            entityId: existing.id,
            entityName: "",
            description: `Updated leave to ${action.type} for ${action.recruiterId} on ${action.date}.`,
          }),
        };
      }
      const newLeave: LeaveRecord = {
        id: createPrefixedId("leave"),
        recruiterId: action.recruiterId,
        date: action.date,
        type: action.type as LeaveType,
        markedBy: action.actorName,
      };
      return {
        ...state,
        leaves: [...existingLeaves, newLeave],
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Marked leave",
          entityType: "candidate",
          entityId: newLeave.id,
          entityName: "",
          description: `Marked ${action.type} for ${action.recruiterId} on ${action.date}.`,
        }),
      };
    }
    case "update-recruiter": {
      return {
        ...state,
        recruiters: state.recruiters.map((r) =>
          r.id === action.recruiterId ? { ...action.recruiter, id: action.recruiterId } : r
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated recruiter profile",
          entityType: "recruiter",
          entityId: action.recruiterId,
          entityName: action.recruiter.name,
          description: `Updated profile for ${action.recruiter.name}.`,
        }),
      };
    }
    case "delete-recruiter": {
      const removedSpocIds = new Set(
        state.spocs.filter((spoc) => spoc.recruiterId === action.recruiterId).map((spoc) => spoc.id)
      );
      const removedPositionIds = new Set(
        state.positions
          .filter((position) => position.recruiterId === action.recruiterId || removedSpocIds.has(position.spocId))
          .map((position) => position.id)
      );
      const removedCandidateIds = new Set(
        state.candidates
          .filter(
            (candidate) =>
              candidate.recruiterId === action.recruiterId ||
              removedPositionIds.has(candidate.positionId) ||
              removedSpocIds.has(candidate.spocId)
          )
          .map((candidate) => candidate.id)
      );
      return {
        ...state,
        recruiters: state.recruiters.filter((r) => r.id !== action.recruiterId),
        spocs: state.spocs.filter((spoc) => !removedSpocIds.has(spoc.id)),
        positions: state.positions.filter((position) => !removedPositionIds.has(position.id)),
        candidates: state.candidates.filter((candidate) => !removedCandidateIds.has(candidate.id)),
        interviews: state.interviews.filter(
          (interview) =>
            interview.recruiterId !== action.recruiterId &&
            !removedPositionIds.has(interview.positionId) &&
            !removedCandidateIds.has(interview.candidateId)
        ),
        offers: state.offers.filter(
          (offer) =>
            offer.recruiterId !== action.recruiterId &&
            !removedPositionIds.has(offer.positionId) &&
            !removedCandidateIds.has(offer.candidateId)
        ),
        joinings: state.joinings.filter(
          (joining) =>
            joining.recruiterId !== action.recruiterId &&
            !removedPositionIds.has(joining.positionId) &&
            !removedCandidateIds.has(joining.candidateId)
        ),
        leaves: (state.leaves ?? []).filter((leave) => leave.recruiterId !== action.recruiterId),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Deleted recruiter profile",
          entityType: "recruiter",
          entityId: action.recruiterId,
          entityName: "",
          description: `Deleted recruiter ${action.recruiterId}`,
        }),
      };
    }
    case "add-client": {
      const newClient: Client = {
        ...action.client,
        id: action.clientId ?? createPrefixedId("client"),
      };
      return {
        ...state,
        clients: [...state.clients, newClient],
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Added client",
          entityType: "client",
          entityId: newClient.id,
          entityName: newClient.name,
          description: `Added client ${newClient.name}.`,
        }),
      };
    }
    case "update-client": {
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.clientId ? { ...action.client, id: action.clientId } : c
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated client",
          entityType: "client",
          entityId: action.clientId,
          entityName: action.client.name,
          description: `Updated client ${action.client.name}.`,
        }),
      };
    }
    case "delete-client": {
      const removedPositionIds = new Set(
        state.positions.filter((position) => position.clientId === action.clientId).map((position) => position.id)
      );
      const removedCandidateIds = new Set(
        state.candidates
          .filter((candidate) => candidate.clientId === action.clientId || removedPositionIds.has(candidate.positionId))
          .map((candidate) => candidate.id)
      );
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.clientId),
        spocs: state.spocs.filter((s) => s.clientId !== action.clientId),
        positions: state.positions.filter((position) => !removedPositionIds.has(position.id)),
        candidates: state.candidates.filter((candidate) => !removedCandidateIds.has(candidate.id)),
        interviews: state.interviews.filter(
          (interview) =>
            interview.clientId !== action.clientId &&
            !removedPositionIds.has(interview.positionId) &&
            !removedCandidateIds.has(interview.candidateId)
        ),
        offers: state.offers.filter(
          (offer) =>
            offer.clientId !== action.clientId &&
            !removedPositionIds.has(offer.positionId) &&
            !removedCandidateIds.has(offer.candidateId)
        ),
        joinings: state.joinings.filter(
          (joining) =>
            joining.clientId !== action.clientId &&
            !removedPositionIds.has(joining.positionId) &&
            !removedCandidateIds.has(joining.candidateId)
        ),
        cvSharedEntries: state.cvSharedEntries.filter((entry) => entry.clientId !== action.clientId),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Deleted client",
          entityType: "client",
          entityId: action.clientId,
          entityName: "",
          description: `Deleted client ${action.clientId}`,
        }),
      };
    }
    case "add-spoc": {
      const newSpoc: ClientSpoc = {
        ...action.spoc,
        id: action.spocId ?? createPrefixedId("spoc"),
      };
      return {
        ...state,
        spocs: [...state.spocs, newSpoc],
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Added SPOC",
          entityType: "spoc",
          entityId: newSpoc.id,
          entityName: newSpoc.name,
          description: `Added SPOC ${newSpoc.name} for client ${newSpoc.clientId}.`,
        }),
      };
    }
    case "update-spoc": {
      return {
        ...state,
        spocs: state.spocs.map((s) =>
          s.id === action.spocId ? { ...action.spoc, id: action.spocId } : s
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated SPOC",
          entityType: "spoc",
          entityId: action.spocId,
          entityName: action.spoc.name,
          description: `Updated SPOC ${action.spoc.name}.`,
        }),
      };
    }
    case "delete-spoc": {
      return {
        ...state,
        spocs: state.spocs.filter((s) => s.id !== action.spocId),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Deleted SPOC",
          entityType: "spoc",
          entityId: action.spocId,
          entityName: "",
          description: `Deleted SPOC ${action.spocId}`,
        }),
      };
    }
    case "add-position": {
      const newPosition: Position = {
        ...action.position,
        id: action.positionId ?? createPrefixedId("pos"),
      };
      return {
        ...state,
        positions: [...state.positions, newPosition],
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Added position",
          entityType: "position",
          entityId: newPosition.id,
          entityName: newPosition.name,
          description: `${newPosition.name} added for client ${newPosition.clientId}.`,
        }),
      };
    }
    case "update-position-all": {
      const position = state.positions.find((item) => item.id === action.positionId);
      if (!position) {
        return state;
      }
      return {
        ...state,
        positions: state.positions.map((item) =>
          item.id === action.positionId
            ? { ...item, ...action.position, id: action.positionId }
            : item
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated position",
          entityType: "position",
          entityId: position.id,
          entityName: position.name,
          description: `${position.name} details updated.`,
        }),
      };
    }
    case "delete-position": {
      const position = state.positions.find((item) => item.id === action.positionId);
      if (!position) {
        return state;
      }
      return {
        ...state,
        positions: state.positions.map((item) =>
          item.id === action.positionId ? { ...item, status: "Closed" as const } : item
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Deleted position",
          entityType: "position",
          entityId: position.id,
          entityName: position.name,
          description: `${position.name} closed. Candidates and interviews retain this position reference for tracking.`,
        }),
      };
    }
    case "add-interview": {
      const newInterview: Interview = {
        ...action.interview,
        id: action.interviewId ?? createPrefixedId("int"),
      };
      const updatedCandidates = state.candidates.map((candidate) =>
        candidate.id === action.interview.candidateId && candidate.stage === "CV Submitted"
          ? { ...candidate, stage: "Interview" as const }
          : candidate
      );
      return {
        ...state,
        interviews: [...state.interviews, newInterview],
        candidates: updatedCandidates,
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Added interview",
          entityType: "interview",
          entityId: newInterview.id,
          entityName: newInterview.id,
          description: `Interview added for candidate ${action.interview.candidateId}.`,
        }),
      };
    }
    case "update-interview-all": {
      const interview = state.interviews.find((item) => item.id === action.interviewId);
      if (!interview) {
        return state;
      }
      let updatedCandidates = state.candidates;
      if (action.interview.status === "Final Select") {
        const today = new Date().toISOString().slice(0, 10);
        updatedCandidates = state.candidates.map((c) =>
          c.id === interview.candidateId && c.stage !== "Final Selection"
            ? { ...c, stage: "Final Selection" as const, finalSelectDate: today, finalSelectStatus: "Document Pending" as const }
            : c
        );
      }
      return {
        ...state,
        interviews: state.interviews.map((item) =>
          item.id === action.interviewId
            ? { ...item, ...action.interview, id: action.interviewId }
            : item
        ),
        candidates: updatedCandidates,
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated interview",
          entityType: "interview",
          entityId: interview.id,
          entityName: interview.id,
          description: `Interview details updated for candidate ${action.interview.candidateId}.`,
        }),
      };
    }
    case "delete-interview": {
      const interview = state.interviews.find((item) => item.id === action.interviewId);
      if (!interview) {
        return state;
      }
      return {
        ...state,
        interviews: state.interviews.filter((item) => item.id !== action.interviewId),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Deleted interview",
          entityType: "interview",
          entityId: interview.id,
          entityName: interview.id,
          description: `Interview deleted for candidate ${interview.candidateId}.`,
        }),
      };
    }
    case "add-recruiter": {
      const existing = state.recruiters.find(
        (item) => item.email.trim().toLowerCase() === action.recruiter.email.trim().toLowerCase()
      );
      if (existing) {
        return state;
      }
      const newRecruiter: Recruiter = {
        ...action.recruiter,
        id: action.recruiterId ?? createPrefixedId("rec"),
      };
      return {
        ...state,
        recruiters: [...state.recruiters, newRecruiter],
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Added recruiter profile",
          entityType: "role",
          entityId: newRecruiter.id,
          entityName: newRecruiter.name,
          description: `${newRecruiter.name} added as recruiter.`,
        }),
      };
    }
    case "add-candidate": {
      const newCandidate: Candidate = {
        ...action.candidate,
        id: action.candidateId ?? createPrefixedId("cand"),
      };
      return {
        ...state,
        candidates: [...state.candidates, newCandidate],
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Added candidate",
          entityType: "candidate",
          entityId: newCandidate.id,
          entityName: newCandidate.name,
          description: `${newCandidate.name} added for position ${newCandidate.positionId}.`,
        }),
      };
    }
    case "update-candidate-all": {
      return {
        ...state,
        candidates: state.candidates.map((c) =>
          c.id === action.candidateId
            ? { ...action.candidate, id: action.candidateId }
            : c
        ),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated candidate profile",
          entityType: "candidate",
          entityId: action.candidateId,
          entityName: action.candidate.name,
          description: `${action.candidate.name} profile updated.`,
        }),
      };
    }
    case "delete-candidate": {
      const candidate = state.candidates.find((c) => c.id === action.candidateId);
      if (!candidate) return state;
      const removedInterviewIds = state.interviews.filter((i) => i.candidateId === action.candidateId).map((i) => i.id);
      const removedOfferIds = state.offers.filter((o) => o.candidateId === action.candidateId).map((o) => o.id);
      const removedJoiningIds = state.joinings.filter((j) => j.candidateId === action.candidateId).map((j) => j.id);
      return {
        ...state,
        candidates: state.candidates.filter((c) => c.id !== action.candidateId),
        interviews: state.interviews.filter((i) => i.candidateId !== action.candidateId),
        offers: state.offers.filter((o) => o.candidateId !== action.candidateId),
        joinings: state.joinings.filter((j) => j.candidateId !== action.candidateId),
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Deleted candidate",
          entityType: "candidate",
          entityId: candidate.id,
          entityName: candidate.name,
          description: `${candidate.name} deleted. Removed ${removedInterviewIds.length} interviews, ${removedOfferIds.length} offers, and ${removedJoiningIds.length} joinings.`,
        }),
      };
    }
    case "update-final-select": {
      const candidate = state.candidates.find((c) => c.id === action.candidateId);
      const isOfferReleased = action.finalSelectStatus === "Offer Released";
      const isPreOfferLose = ["Pre Offer Lose", "Client Reject", "Drop", "BGV Reject"].includes(action.finalSelectStatus);
      const existingOffer = state.offers.find((o) => o.candidateId === action.candidateId);

      const updatedCandidates = state.candidates.map((c) =>
        c.id === action.candidateId
          ? {
              ...c,
              currentCtc: action.currentCtc,
              expectedCtc: action.expectedCtc,
              noticePeriod: action.noticePeriod,
              finalSelectDate: action.finalSelectDate,
              finalSelectStatus: action.finalSelectStatus,
              remarks: action.remarks,
              holdingOfferCtc: action.holdingOfferCtc,
              holdingOfferCompany: action.holdingOfferCompany,
              holdingOfferDoj: action.holdingOfferDoj,
              stage: isOfferReleased ? "Offer" as const : c.stage,
            }
          : c
      );

      const activities: ActivityLog[] = [];
      let updatedOffers = state.offers;
      let updatedJoinings = state.joinings;

      if (isOfferReleased && candidate) {
        if (existingOffer) {
          updatedOffers = state.offers.map((o) =>
            o.id === existingOffer.id
              ? {
                  ...o,
                  ctc: action.offeredCtc || o.ctc,
                  billValue: action.billValue || o.billValue,
                  offerDate: new Date().toISOString().split("T")[0],
                  selectionStatus: "Joining Pending" as const,
                  status: "Pending" as const,
                }
              : o
          );
          activities.push({
            id: createPrefixedId("log"),
            timestamp: new Date().toISOString(),
            actorRole: state.currentUserRole,
            actorName: action.actorName,
            action: "Updated offer",
            entityType: "offer",
            entityId: existingOffer.id,
            entityName: existingOffer.id,
            description: `Offer updated with bill value for candidate ${action.candidateId}.`,
          });
        } else {
          const newOffer = {
            id: createPrefixedId("offer"),
            candidateId: action.candidateId,
            positionId: candidate.positionId,
            recruiterId: candidate.recruiterId,
            clientId: candidate.clientId,
            status: "Sent" as const,
            offerDate: new Date().toISOString().split("T")[0],
            ctc: action.offeredCtc || action.expectedCtc || candidate.expectedCtc || 0,
            billValue: action.billValue || 0,
            selectionStatus: "Joining Pending" as const,
            remarks: action.remarks || candidate.remarks || "",
          };
          updatedOffers = [...state.offers, newOffer];
          activities.push({
            id: createPrefixedId("log"),
            timestamp: new Date().toISOString(),
            actorRole: state.currentUserRole,
            actorName: action.actorName,
            action: "Created offer",
            entityType: "offer",
            entityId: newOffer.id,
            entityName: newOffer.id,
            description: `Offer created for candidate ${action.candidateId}.`,
          });
        }

        if (action.joiningDate) {
          const existing = state.joinings.find((j) => j.candidateId === action.candidateId);
          if (existing) {
            updatedJoinings = state.joinings.map((j) =>
              j.id === existing.id
                ? { ...j, joiningDate: action.joiningDate! }
                : j
            );
          } else {
            updatedJoinings = [
              ...state.joinings,
              {
                id: createPrefixedId("join"),
                candidateId: action.candidateId,
                positionId: candidate.positionId,
                clientId: candidate.clientId,
                recruiterId: candidate.recruiterId,
                status: "Not Joined" as const,
                joiningDate: action.joiningDate,
                remarks: action.remarks || candidate.remarks || "",
              },
            ];
          }
          activities.push({
            id: createPrefixedId("log"),
            timestamp: new Date().toISOString(),
            actorRole: state.currentUserRole,
            actorName: action.actorName,
            action: "Created joining",
            entityType: "joining",
            entityId: action.candidateId,
            entityName: action.candidateId,
            description: `Joining created for candidate ${action.candidateId}.`,
          });
        }
      }

      if (isPreOfferLose && existingOffer) {
        updatedOffers = state.offers.filter((o) => o.id !== existingOffer.id);
      }

      activities.unshift({
        id: createPrefixedId("log"),
        timestamp: new Date().toISOString(),
        actorRole: state.currentUserRole,
        actorName: action.actorName,
        action: "Updated final select details",
        entityType: "candidate",
        entityId: action.candidateId,
        entityName: action.candidateId,
        description: `Final select details updated for candidate ${action.candidateId}.`,
      });

      return {
        ...state,
        candidates: updatedCandidates,
        offers: updatedOffers,
        joinings: updatedJoinings,
        activityLog: [...state.activityLog, ...activities],
      };
    }
    case "update-selection": {
      let updatedOffers = state.offers.map((o) =>
        o.id === action.offerId
          ? { ...o, billValue: action.billValue, offerDate: action.offerDate, selectionStatus: action.selectionStatus, remarks: action.remarks }
          : o
      );
      let updatedJoinings = state.joinings;

      if (action.selectionStatus === "Joined") {
        updatedOffers = updatedOffers.map((o) =>
          o.id === action.offerId ? { ...o, status: "Accepted" as const } : o
        );
        const existing = state.joinings.find((j) => j.candidateId === action.candidateId);
        if (existing) {
          updatedJoinings = state.joinings.map((j) =>
            j.id === existing.id
              ? { ...j, status: "Joined" as const, joiningDate: action.joiningDate, remarks: action.remarks }
              : j
          );
        } else {
          updatedJoinings = [
            ...state.joinings,
            {
              id: createPrefixedId("join"),
              candidateId: action.candidateId,
              positionId: action.positionId,
              clientId: action.clientId,
              recruiterId: action.recruiterId,
              status: "Joined" as const,
              joiningDate: action.joiningDate,
              remarks: action.remarks,
            },
          ];
        }
      } else if (action.selectionStatus === "Offer Declined") {
        updatedOffers = updatedOffers.map((o) =>
          o.id === action.offerId ? { ...o, status: "Declined" as const } : o
        );
        updatedJoinings = state.joinings.filter((j) => j.candidateId !== action.candidateId);
      } else {
        updatedOffers = updatedOffers.map((o) =>
          o.id === action.offerId ? { ...o, status: "Sent" as const } : o
        );
        updatedJoinings = state.joinings.filter((j) => j.candidateId !== action.candidateId);
      }

      const updatedCandidatesSel = state.candidates.map((c) =>
        c.id === action.candidateId
          ? {
              ...c,
              stage: action.selectionStatus === "Joined"
                ? "Joined" as const
                : action.selectionStatus === "Offer Declined"
                  ? "Final Selection" as const
                  : c.stage,
              holdingOfferCtc: action.holdingOfferCtc,
              holdingOfferCompany: action.holdingOfferCompany,
              holdingOfferDoj: action.holdingOfferDoj,
            }
          : c
      );

      return {
        ...state,
        candidates: updatedCandidatesSel,
        offers: updatedOffers,
        joinings: updatedJoinings,
        activityLog: appendActivity(state, {
          actorName: action.actorName,
          action: "Updated selection",
          entityType: "offer",
          entityId: action.offerId,
          entityName: action.offerId,
          description: `Selection status updated to ${action.selectionStatus}.`,
        }),
      };
    }
    default:
      return state;
  }
}

export type DashboardTableName =
  | "clients" | "spocs" | "recruiters" | "positions"
  | "candidates" | "interviews" | "offers" | "joinings"
  | "cv_shared_entries" | "leaves" | "activity_log";

export type DirtyRowIds = Map<DashboardTableName, Set<string>>;

export function computeDirtyRowIds(
  prev: DashboardState,
  next: DashboardState,
  tables: Set<DashboardTableName>
): DirtyRowIds {
  const map: DirtyRowIds = new Map();

  const TABLE_TO_STATE: Record<DashboardTableName, keyof DashboardState> = {
    clients: "clients",
    spocs: "spocs",
    recruiters: "recruiters",
    positions: "positions",
    candidates: "candidates",
    interviews: "interviews",
    offers: "offers",
    joinings: "joinings",
    cv_shared_entries: "cvSharedEntries",
    leaves: "leaves",
    activity_log: "activityLog",
  };

  function getArray(t: DashboardTableName): Array<{ id: string }> {
    const key = TABLE_TO_STATE[t];
    const nextVal = next[key] as Array<{ id: string }> | undefined;
    const prevVal = prev[key] as Array<{ id: string }> | undefined;
    if (t === "leaves") {
      const a = prevVal ?? [];
      const b = nextVal ?? [];
      return a !== b ? b : a;
    }
    return prevVal !== nextVal ? (nextVal ?? []) : (prevVal ?? []);
  }

  for (const table of tables) {
    if (table === "activity_log") continue; // always sync activity_log in full
    const nextRows = getArray(table);
    const prevRows = getArray(table);

    if (prevRows === nextRows) continue; // reference equality = no change, skip

    const nextIds = new Set(nextRows.map((r) => r.id));
    const dirty = new Set<string>();

    for (const r of prevRows) {
      if (!nextIds.has(r.id)) dirty.add(r.id);
    }
    for (const r of nextRows) {
      if (!dirty.has(r.id)) dirty.add(r.id);
    }

    if (dirty.size > 0) {
      map.set(table, dirty);
    }
  }

  return map;
}

export function getAffectedTables(action: DashboardAction): Set<DashboardTableName> {
  switch (action.kind) {
    case "set-role":
      return new Set(["activity_log"]);
    case "update-interview":
      return new Set(["interviews", "candidates", "activity_log"]);
    case "update-candidate":
      return new Set(["candidates", "activity_log"]);
    case "update-offer":
      return new Set(["offers", "candidates", "activity_log"]);
    case "update-joining":
      return new Set(["joinings", "candidates", "activity_log"]);
    case "update-position":
      return new Set(["positions", "activity_log"]);
    case "update-cv-shared":
      return new Set(["cv_shared_entries", "activity_log"]);
    case "add-cv-shared":
      return new Set(["cv_shared_entries", "activity_log"]);
    case "add-position":
      return new Set(["positions", "activity_log"]);
    case "update-position-all":
      return new Set(["positions", "activity_log"]);
    case "delete-position":
      return new Set(["positions", "activity_log"]);
    case "add-interview":
      return new Set(["interviews", "candidates", "activity_log"]);
    case "add-recruiter":
    case "update-recruiter":
      return new Set(["recruiters", "activity_log"]);
    case "delete-recruiter":
      return new Set(["recruiters", "positions", "candidates", "interviews", "offers", "joinings", "spocs", "activity_log"]);
    case "update-interview-all":
      return new Set(["interviews", "activity_log"]);
    case "delete-interview":
      return new Set(["interviews", "activity_log"]);
    case "add-candidate":
      return new Set(["candidates", "activity_log"]);
    case "update-candidate-all":
      return new Set(["candidates", "activity_log"]);
    case "delete-candidate":
      return new Set(["candidates", "interviews", "offers", "joinings", "activity_log"]);
    case "update-final-select":
      return new Set(["candidates", "offers", "joinings", "activity_log"]);
    case "update-selection":
      return new Set(["offers", "joinings", "candidates", "activity_log"]);
    case "mark-leave":
      return new Set(["leaves", "activity_log"]);
    case "add-client":
    case "update-client":
      return new Set(["clients", "activity_log"]);
    case "delete-client":
      return new Set(["clients", "spocs", "positions", "candidates", "interviews", "offers", "joinings", "cv_shared_entries", "activity_log"]);
    case "add-spoc":
    case "update-spoc":
    case "delete-spoc":
      return new Set(["spocs", "activity_log"]);
  }
}
