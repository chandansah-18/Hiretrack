import type { SupabaseClient } from "@supabase/supabase-js";
import { createSeedState } from "./seed";
import type { DashboardTableName, DirtyRowIds } from "./mutations";
import type {
  ActivityLog,
  Candidate,
  Client,
  ClientSpoc,
  CvSharedEntry,
  DashboardState,
  Interview,
  Joining,
  LeaveRecord,
  Offer,
  Position,
  Recruiter,
  Role,
} from "./types";
import { notifyDashboardStateChanged } from "./sync";
import { computeRowSyncPlan } from "./table-sync";

type RowWithId = { id: string };

type ProfileRow = {
  id: string;
  display_name: string;
  role: Role;
  active: boolean;
};

type ClientRow = {
  id: string;
  name: string;
  industry: string;
  owner_recruiter_id: string;
  created_at?: string;
  updated_at?: string;
};

type SpocRow = {
  id: string;
  client_id: string;
  name: string;
  email: string;
  recruiter_id: string;
  created_at?: string;
  updated_at?: string;
};

type RecruiterRow = {
  id: string;
  name: string;
  email: string;
  vertical: string;
  target: number;
  active: boolean;
  can_edit: boolean;
  designation?: string | null;
  contact_no?: string | null;
  birthday?: string | null;
  created_at?: string;
  updated_at?: string;
};

type PositionRow = {
  id: string;
  name: string;
  client_id: string;
  recruiter_id: string;
  spoc_id: string;
  vertical: string;
  technology: string;
  status: string;
  open_date: string;
  openings: number;
  ctc: number;
  location: string[];
  remarks: string;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type CandidateRow = {
  id: string;
  name: string;
  contact_no: string;
  email_id: string;
  position_id: string;
  client_id: string;
  recruiter_id: string;
  spoc_id: string;
  technology: string;
  stage: string;
  submitted_at: string;
  source: string;
  remarks: string;
  current_ctc: number;
  expected_ctc: number;
  notice_period: string;
  current_company: string;
  experience: number;
  location: string;
  requisition_id: string;
  final_select_date: string | null;
  final_select_status: string;
  holding_offer_ctc: number;
  holding_offer_company: string;
  holding_offer_doj: string;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type InterviewRow = {
  id: string;
  candidate_id: string;
  position_id: string;
  client_id: string;
  recruiter_id: string;
  interview_date: string;
  time: string;
  round: string;
  status: string;
  feedback_due: string;
  remarks: string;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type OfferRow = {
  id: string;
  candidate_id: string;
  position_id: string;
  recruiter_id: string;
  client_id: string;
  status: string;
  offer_date: string;
  ctc: number;
  remarks: string;
  bill_value: number;
  selection_status: string;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type JoiningRow = {
  id: string;
  candidate_id: string;
  position_id: string;
  recruiter_id: string;
  client_id: string;
  status: string;
  joining_date: string;
  remarks: string;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type CvSharedEntryRow = {
  id: string;
  client_id: string;
  month: string;
  count: number;
  created_at?: string;
  updated_at?: string;
};

type LeavesRow = {
  id: string;
  recruiter_id: string;
  date: string;
  type: string;
  marked_by: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
};

type ActivityLogRow = {
  id: string;
  timestamp: string;
  actor_role: Role;
  actor_name: string;
  action: string;
  entity_type: ActivityLog["entityType"];
  entity_id: string;
  entity_name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
};

function toClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    ownerRecruiterId: row.owner_recruiter_id,
  };
}

function toSpoc(row: SpocRow): ClientSpoc {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    email: row.email,
    recruiterId: row.recruiter_id,
  };
}

function toRecruiter(row: RecruiterRow): Recruiter {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    vertical: row.vertical,
    target: row.target,
    active: row.active,
    canEdit: row.can_edit,
    designation: row.designation ?? undefined,
    contactNo: row.contact_no ?? undefined,
    birthday: row.birthday ?? undefined,
  };
}

function toPosition(row: PositionRow): Position {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    recruiterId: row.recruiter_id,
    spocId: row.spoc_id,
    vertical: row.vertical,
    technology: row.technology,
    status: row.status as Position["status"],
    openDate: row.open_date,
    openings: row.openings,
    ctc: row.ctc,
    location: row.location ?? [],
    remarks: row.remarks,
  };
}

function toCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    name: row.name,
    contactNo: row.contact_no,
    emailId: row.email_id ?? "",
    positionId: row.position_id,
    clientId: row.client_id,
    recruiterId: row.recruiter_id,
    spocId: row.spoc_id,
    technology: row.technology,
    stage: row.stage as Candidate["stage"],
    submittedAt: row.submitted_at,
    source: row.source,
    remarks: row.remarks,
    currentCtc: row.current_ctc,
    expectedCtc: row.expected_ctc,
    noticePeriod: row.notice_period,
    currentCompany: row.current_company ?? "",
    experience: row.experience ?? 0,
    location: row.location ?? "",
    requisitionId: row.requisition_id ?? "",
    finalSelectDate: row.final_select_date ?? "",
    finalSelectStatus: row.final_select_status as Candidate["finalSelectStatus"],
    holdingOfferCtc: row.holding_offer_ctc,
    holdingOfferCompany: row.holding_offer_company,
    holdingOfferDoj: row.holding_offer_doj,
  };
}

function toInterview(row: InterviewRow): Interview {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    positionId: row.position_id,
    clientId: row.client_id,
    recruiterId: row.recruiter_id,
    interviewDate: row.interview_date,
    time: row.time,
    round: row.round,
    status: row.status as Interview["status"],
    feedbackDue: row.feedback_due,
    remarks: row.remarks,
  };
}

function toOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    positionId: row.position_id,
    recruiterId: row.recruiter_id,
    clientId: row.client_id,
    status: row.status as Offer["status"],
    offerDate: row.offer_date,
    ctc: row.ctc,
    remarks: row.remarks,
    billValue: row.bill_value,
    selectionStatus: row.selection_status as Offer["selectionStatus"],
  };
}

function toJoining(row: JoiningRow): Joining {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    positionId: row.position_id,
    recruiterId: row.recruiter_id,
    clientId: row.client_id,
    status: row.status as Joining["status"],
    joiningDate: row.joining_date,
    remarks: row.remarks,
  };
}

function toCvSharedEntry(row: CvSharedEntryRow): CvSharedEntry {
  return {
    id: row.id,
    clientId: row.client_id,
    month: row.month,
    count: row.count,
  };
}

function toLeave(row: LeavesRow): LeaveRecord {
  return {
    id: row.id,
    recruiterId: row.recruiter_id,
    date: row.date,
    type: row.type as LeaveRecord["type"],
    markedBy: row.marked_by,
    remarks: row.remarks,
  };
}

function toActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    timestamp: row.timestamp,
    actorRole: row.actor_role,
    actorName: row.actor_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name,
    description: row.description,
  };
}

function fromClient(item: Client): ClientRow {
  return {
    id: item.id,
    name: item.name,
    industry: item.industry,
    owner_recruiter_id: item.ownerRecruiterId,
  };
}

function fromSpoc(item: ClientSpoc): SpocRow {
  return {
    id: item.id,
    client_id: item.clientId,
    name: item.name,
    email: item.email,
    recruiter_id: item.recruiterId,
  };
}

function fromRecruiter(item: Recruiter): RecruiterRow {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    vertical: item.vertical,
    target: item.target,
    active: item.active,
    can_edit: item.canEdit,
    designation: item.designation ?? null,
    contact_no: item.contactNo ?? null,
    birthday: item.birthday ?? null,
  };
}

function safeDate(value: string | null | undefined): string | null {
  return value || null;
}

function fromPosition(item: Position): PositionRow {
  return {
    id: item.id,
    name: item.name,
    client_id: item.clientId,
    recruiter_id: item.recruiterId,
    spoc_id: item.spocId,
    vertical: item.vertical,
    technology: item.technology,
    status: item.status,
    open_date: safeDate(item.openDate) ?? new Date().toISOString().slice(0, 10),
    openings: item.openings,
    ctc: item.ctc,
    location: item.location,
    remarks: item.remarks,
    archived_at: null,
  };
}

function fromCandidate(item: Candidate): CandidateRow {
  return {
    id: item.id,
    name: item.name,
    contact_no: item.contactNo,
    email_id: item.emailId || "",
    position_id: item.positionId,
    client_id: item.clientId,
    recruiter_id: item.recruiterId,
    spoc_id: item.spocId,
    technology: item.technology,
    stage: item.stage,
    submitted_at: safeDate(item.submittedAt) ?? new Date().toISOString().slice(0, 10),
    source: item.source,
    remarks: item.remarks,
    current_ctc: item.currentCtc,
    expected_ctc: item.expectedCtc,
    notice_period: item.noticePeriod,
    current_company: item.currentCompany || "",
    experience: item.experience || 0,
    location: item.location || "",
    requisition_id: item.requisitionId || "",
    final_select_date: item.finalSelectDate || null,
    final_select_status: item.finalSelectStatus,
    holding_offer_ctc: item.holdingOfferCtc,
    holding_offer_company: item.holdingOfferCompany,
    holding_offer_doj: item.holdingOfferDoj,
    archived_at: null,
  };
}

function fromInterview(item: Interview): InterviewRow {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: item.id,
    candidate_id: item.candidateId,
    position_id: item.positionId,
    client_id: item.clientId,
    recruiter_id: item.recruiterId,
    interview_date: safeDate(item.interviewDate) ?? today,
    time: item.time,
    round: item.round,
    status: item.status,
    feedback_due: safeDate(item.feedbackDue) ?? today,
    remarks: item.remarks,
    archived_at: null,
  };
}

function fromOffer(item: Offer): OfferRow {
  return {
    id: item.id,
    candidate_id: item.candidateId,
    position_id: item.positionId,
    recruiter_id: item.recruiterId,
    client_id: item.clientId,
    status: item.status,
    offer_date: safeDate(item.offerDate) ?? new Date().toISOString().slice(0, 10),
    ctc: item.ctc,
    remarks: item.remarks,
    bill_value: item.billValue,
    selection_status: item.selectionStatus,
    archived_at: null,
  };
}

function fromJoining(item: Joining): JoiningRow {
  return {
    id: item.id,
    candidate_id: item.candidateId,
    position_id: item.positionId,
    recruiter_id: item.recruiterId,
    client_id: item.clientId,
    status: item.status,
    joining_date: safeDate(item.joiningDate) ?? new Date().toISOString().slice(0, 10),
    remarks: item.remarks,
    archived_at: null,
  };
}

function fromCvSharedEntry(item: CvSharedEntry): CvSharedEntryRow {
  return {
    id: item.id,
    client_id: item.clientId,
    month: item.month,
    count: item.count,
  };
}

function fromLeave(item: LeaveRecord): LeavesRow {
  return {
    id: item.id,
    recruiter_id: item.recruiterId,
    date: item.date,
    type: item.type,
    marked_by: item.markedBy,
    remarks: item.remarks,
  };
}

function fromActivityLog(item: ActivityLog): ActivityLogRow {
  return {
    id: item.id,
    timestamp: item.timestamp,
    actor_role: item.actorRole,
    actor_name: item.actorName,
    action: item.action,
    entity_type: item.entityType,
    entity_id: item.entityId,
    entity_name: item.entityName,
    description: item.description,
  };
}

const SOFT_ARCHIVE_TABLES = new Set<DashboardTableName>([
  "candidates",
  "interviews",
  "positions",
  "offers",
  "joinings",
]);

async function syncRows<T extends RowWithId>(
  client: SupabaseClient,
  table: DashboardTableName,
  rows: T[],
  previousRows?: T[]
) {
  const { upserts, deletes } = computeRowSyncPlan(previousRows, rows);

  if (deletes.length > 0) {
    if (SOFT_ARCHIVE_TABLES.has(table)) {
      const { error: archiveError } = await client
        .from(table)
        .update({ archived_at: new Date().toISOString() })
        .in("id", deletes);
      if (archiveError) {
        // Fallback for DBs that have not applied the archive migration yet
        const { error: deleteError } = await client.from(table).delete().in("id", deletes);
        if (deleteError) {
          throw deleteError;
        }
      }
    } else {
      const { error: deleteError } = await client.from(table).delete().in("id", deletes);
      if (deleteError) {
        throw deleteError;
      }
    }
  }

  if (upserts.length > 0) {
    const { error: upsertError } = await client.from(table).upsert(upserts, { onConflict: "id" });
    if (upsertError) {
      if (table === "candidates" && typeof upsertError.message === "string" && upsertError.message.includes("holding_offer")) {
        const stripped = (upserts as Record<string, unknown>[]).map((r) => {
          const { holding_offer_ctc, holding_offer_company, holding_offer_doj, ...rest } = r;
          return rest;
        });
        const { error: retryError } = await client.from(table).upsert(stripped, { onConflict: "id" });
        if (retryError) throw retryError;
      } else {
        throw upsertError;
      }
    }
  }
}

/** Months of transactional history kept in the hot client cache. */
export const HOT_DATA_MONTHS = 18;
export const CANDIDATE_HOT_LIMIT = 3000;
export const INTERVIEW_HOT_LIMIT = 3000;
export const OFFER_HOT_LIMIT = 2000;
export const JOINING_HOT_LIMIT = 2000;

function hotDataCutoffDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - HOT_DATA_MONTHS);
  return d.toISOString().slice(0, 10);
}

async function loadProfile(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, role, active")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ProfileRow | null;
}

async function loadTableRows(
  client: SupabaseClient,
  table: DashboardTableName | "profiles",
  userId?: string
): Promise<Partial<DashboardState>> {
  const cutoff = hotDataCutoffDate();

  switch (table) {
    case "clients": {
      const { data, error } = await client.from("clients").select("*").order("name", { ascending: true });
      if (error) throw error;
      return { clients: (data ?? []).map((row) => toClient(row as ClientRow)) };
    }
    case "spocs": {
      const { data, error } = await client.from("spocs").select("*").order("name", { ascending: true });
      if (error) throw error;
      return { spocs: (data ?? []).map((row) => toSpoc(row as SpocRow)) };
    }
    case "recruiters": {
      const { data, error } = await client.from("recruiters").select("*").order("name", { ascending: true });
      if (error) throw error;
      return { recruiters: (data ?? []).map((row) => toRecruiter(row as RecruiterRow)) };
    }
    case "positions": {
      const { data, error } = await client
        .from("positions")
        .select("*")
        .is("archived_at", null)
        .order("open_date", { ascending: false });
      if (error && String(error.message).includes("archived_at")) {
        const retry = await client.from("positions").select("*").order("open_date", { ascending: false });
        if (retry.error) throw retry.error;
        return { positions: (retry.data ?? []).map((row) => toPosition(row as PositionRow)) };
      }
      if (error) throw error;
      return { positions: (data ?? []).map((row) => toPosition(row as PositionRow)) };
    }
    case "candidates": {
      const { data, error } = await client
        .from("candidates")
        .select("*")
        .is("archived_at", null)
        .gte("submitted_at", cutoff)
        .order("submitted_at", { ascending: false })
        .limit(CANDIDATE_HOT_LIMIT);
      if (error && String(error.message).includes("archived_at")) {
        const retry = await client
          .from("candidates")
          .select("*")
          .gte("submitted_at", cutoff)
          .order("submitted_at", { ascending: false })
          .limit(CANDIDATE_HOT_LIMIT);
        if (retry.error) throw retry.error;
        return { candidates: (retry.data ?? []).map((row) => toCandidate(row as CandidateRow)) };
      }
      if (error) throw error;
      return { candidates: (data ?? []).map((row) => toCandidate(row as CandidateRow)) };
    }
    case "interviews": {
      const { data, error } = await client
        .from("interviews")
        .select("*")
        .is("archived_at", null)
        .gte("interview_date", cutoff)
        .order("interview_date", { ascending: false })
        .order("time", { ascending: false })
        .limit(INTERVIEW_HOT_LIMIT);
      if (error && String(error.message).includes("archived_at")) {
        const retry = await client
          .from("interviews")
          .select("*")
          .gte("interview_date", cutoff)
          .order("interview_date", { ascending: false })
          .order("time", { ascending: false })
          .limit(INTERVIEW_HOT_LIMIT);
        if (retry.error) throw retry.error;
        return { interviews: (retry.data ?? []).map((row) => toInterview(row as InterviewRow)) };
      }
      if (error) throw error;
      return { interviews: (data ?? []).map((row) => toInterview(row as InterviewRow)) };
    }
    case "offers": {
      const { data, error } = await client
        .from("offers")
        .select("*")
        .is("archived_at", null)
        .gte("offer_date", cutoff)
        .order("offer_date", { ascending: false })
        .limit(OFFER_HOT_LIMIT);
      if (error && String(error.message).includes("archived_at")) {
        const retry = await client
          .from("offers")
          .select("*")
          .gte("offer_date", cutoff)
          .order("offer_date", { ascending: false })
          .limit(OFFER_HOT_LIMIT);
        if (retry.error) throw retry.error;
        return { offers: (retry.data ?? []).map((row) => toOffer(row as OfferRow)) };
      }
      if (error) throw error;
      return { offers: (data ?? []).map((row) => toOffer(row as OfferRow)) };
    }
    case "joinings": {
      const { data, error } = await client
        .from("joinings")
        .select("*")
        .is("archived_at", null)
        .gte("joining_date", cutoff)
        .order("joining_date", { ascending: false })
        .limit(JOINING_HOT_LIMIT);
      if (error && String(error.message).includes("archived_at")) {
        const retry = await client
          .from("joinings")
          .select("*")
          .gte("joining_date", cutoff)
          .order("joining_date", { ascending: false })
          .limit(JOINING_HOT_LIMIT);
        if (retry.error) throw retry.error;
        return { joinings: (retry.data ?? []).map((row) => toJoining(row as JoiningRow)) };
      }
      if (error) throw error;
      return { joinings: (data ?? []).map((row) => toJoining(row as JoiningRow)) };
    }
    case "cv_shared_entries": {
      const { data, error } = await client.from("cv_shared_entries").select("*").order("month", { ascending: false });
      if (error) throw error;
      return { cvSharedEntries: (data ?? []).map((row) => toCvSharedEntry(row as CvSharedEntryRow)) };
    }
    case "leaves": {
      const { data, error } = await client.from("leaves").select("*").order("date", { ascending: false }).limit(500);
      if (error) throw error;
      return { leaves: (data ?? []).map((row) => toLeave(row as LeavesRow)) };
    }
    case "activity_log": {
      const { data, error } = await client
        .from("activity_log")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);
      if (error) throw error;
      return { activityLog: (data ?? []).map((row) => toActivityLog(row as ActivityLogRow)) };
    }
    case "profiles": {
      if (!userId) return {};
      const profile = await loadProfile(client, userId);
      if (!profile) return {};
      return {
        currentUserRole: profile.role,
        currentUserName: profile.display_name,
      };
    }
    default:
      return {};
  }
}

export async function reloadDashboardTablesFromSupabase(
  client: SupabaseClient,
  tables: Array<DashboardTableName | "profiles">,
  userId?: string
): Promise<Partial<DashboardState>> {
  const patches = await Promise.all(tables.map((table) => loadTableRows(client, table, userId)));
  return Object.assign({}, ...patches) as Partial<DashboardState>;
}

export async function loadDashboardStateFromSupabase(client: SupabaseClient, userId?: string) {
  const seed = createSeedState();
  const tables: Array<DashboardTableName | "profiles"> = [
    "profiles",
    "clients",
    "spocs",
    "recruiters",
    "positions",
    "candidates",
    "interviews",
    "offers",
    "joinings",
    "cv_shared_entries",
    "leaves",
    "activity_log",
  ];

  const patch = await reloadDashboardTablesFromSupabase(client, tables, userId);

  return {
    currentUserRole: patch.currentUserRole ?? seed.currentUserRole,
    currentUserName: patch.currentUserName ?? seed.currentUserName,
    clients: patch.clients ?? [],
    spocs: patch.spocs ?? [],
    recruiters: patch.recruiters ?? [],
    positions: patch.positions ?? [],
    candidates: patch.candidates ?? [],
    interviews: patch.interviews ?? [],
    offers: patch.offers ?? [],
    joinings: patch.joinings ?? [],
    cvSharedEntries: patch.cvSharedEntries ?? [],
    leaves: patch.leaves ?? [],
    activityLog: patch.activityLog ?? [],
  } as DashboardState;
}

const ALL_TABLES: DashboardTableName[] = [
  "recruiters", "clients", "spocs", "positions", "candidates",
  "interviews", "offers", "joinings", "cv_shared_entries", "leaves",
  "activity_log",
];

// Tables grouped by FK dependency level. Level N depends on level < N.
const SYNC_LEVELS: DashboardTableName[][] = [
  ["recruiters", "leaves"],                  // level 0: no FK deps
  ["clients", "activity_log"],               // level 1: clients â†’ recruiters
  ["spocs", "cv_shared_entries"],            // level 2: spocs â†’ clients, recruiters; cv â†’ clients
  ["positions"],                             // level 3: positions â†’ clients, recruiters, spocs
  ["candidates"],                            // level 4: candidates â†’ positions, clients, recruiters, spocs
  ["interviews", "offers", "joinings"],      // level 5: â†’ candidates, positions, clients, recruiters
];

export async function saveDashboardStateToSupabase(
  client: SupabaseClient,
  state: DashboardState,
  dirtyTables?: Set<DashboardTableName>,
  previousState?: DashboardState,
  dirtyIds?: DirtyRowIds
) {
  const tables = dirtyTables ?? new Set(ALL_TABLES);

  function filterRows<T extends { id: string }>(rows: T[], tableName: DashboardTableName): T[] {
    const ids = dirtyIds?.get(tableName);
    if (!ids || ids.size === 0) return rows;
    return rows.filter((r) => ids.has(r.id));
  }

  for (const level of SYNC_LEVELS) {
    const ops: Promise<void>[] = [];
    for (const table of level) {
      if (!tables.has(table)) continue;
      switch (table) {
        case "clients": ops.push(syncRows(client, "clients", filterRows(state.clients.map(fromClient), "clients"), previousState ? filterRows(previousState.clients.map(fromClient), "clients") : undefined)); break;
        case "spocs": ops.push(syncRows(client, "spocs", filterRows(state.spocs.map(fromSpoc), "spocs"), previousState ? filterRows(previousState.spocs.map(fromSpoc), "spocs") : undefined)); break;
        case "recruiters": ops.push(syncRows(client, "recruiters", filterRows(state.recruiters.map(fromRecruiter), "recruiters"), previousState ? filterRows(previousState.recruiters.map(fromRecruiter), "recruiters") : undefined)); break;
        case "positions": ops.push(syncRows(client, "positions", filterRows(state.positions.map(fromPosition), "positions"), previousState ? filterRows(previousState.positions.map(fromPosition), "positions") : undefined)); break;
        case "candidates": ops.push(syncRows(client, "candidates", filterRows(state.candidates.map(fromCandidate), "candidates"), previousState ? filterRows(previousState.candidates.map(fromCandidate), "candidates") : undefined)); break;
        case "interviews": ops.push(syncRows(client, "interviews", filterRows(state.interviews.map(fromInterview), "interviews"), previousState ? filterRows(previousState.interviews.map(fromInterview), "interviews") : undefined)); break;
        case "offers": ops.push(syncRows(client, "offers", filterRows(state.offers.map(fromOffer), "offers"), previousState ? filterRows(previousState.offers.map(fromOffer), "offers") : undefined)); break;
        case "joinings": ops.push(syncRows(client, "joinings", filterRows(state.joinings.map(fromJoining), "joinings"), previousState ? filterRows(previousState.joinings.map(fromJoining), "joinings") : undefined)); break;
        case "cv_shared_entries": ops.push(syncRows(client, "cv_shared_entries", filterRows(state.cvSharedEntries.map(fromCvSharedEntry), "cv_shared_entries"), previousState ? filterRows(previousState.cvSharedEntries.map(fromCvSharedEntry), "cv_shared_entries") : undefined)); break;
        case "leaves": ops.push(syncRows(client, "leaves", filterRows((state.leaves ?? []).map(fromLeave), "leaves"), previousState ? filterRows((previousState.leaves ?? []).map(fromLeave), "leaves") : undefined)); break;
        case "activity_log": ops.push(syncRows(client, "activity_log", state.activityLog.map(fromActivityLog), previousState?.activityLog.map(fromActivityLog))); break;
      }
    }
    if (ops.length > 0) {
      await Promise.all(ops);
    }
  }
  notifyDashboardStateChanged();
}
