import {
  type DashboardFilters,
  type DashboardState,
  type Interview,
  type Joining,
  type LookupTables,
  type Offer,
  type Position,
  type CvSharedEntry,
  type Client,
} from "./types";
import { formatMonthLabel, isDateInRange, monthKey } from "@/lib/utils";

export function createLookups(state: DashboardState): LookupTables {
  return {
    clients: new Map(state.clients.map((item) => [item.id, item])),
    spocs: new Map(state.spocs.map((item) => [item.id, item])),
    recruiters: new Map(state.recruiters.map((item) => [item.id, item])),
    positions: new Map(state.positions.map((item) => [item.id, item])),
    candidates: new Map(state.candidates.map((item) => [item.id, item])),
    interviews: new Map(state.interviews.map((item) => [item.id, item])),
    offers: new Map(state.offers.map((item) => [item.id, item])),
    joinings: new Map(state.joinings.map((item) => [item.id, item])),
  };
}

function searchTerms(values: Array<string | number | undefined>, search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }
  return values.some((value) => `${value ?? ""}`.toLowerCase().includes(normalizedSearch));
}

export function applyCommonFilters<T extends { clientId: string; recruiterId: string }>(
  rows: T[],
  filters: DashboardFilters,
  options?: {
    extraMatch?: (row: T) => boolean;
    searchFields?: (row: T) => Array<string | number | undefined>;
    dateField?: (row: T) => string;
  }
) {
  return rows.filter((row) => {
    if (filters.clientId && row.clientId !== filters.clientId) {
      return false;
    }
    if (filters.recruiterId && row.recruiterId !== filters.recruiterId) {
      return false;
    }
    if (filters.positionId && "positionId" in row && row.positionId !== filters.positionId) {
      return false;
    }
    if (filters.status && "status" in row && `${row.status}` !== filters.status) {
      return false;
    }
    if (filters.fromDate || filters.toDate) {
      const dateField = options?.dateField?.(row);
      if (!dateField || !isDateInRange(dateField, filters.fromDate || undefined, filters.toDate || undefined)) {
        return false;
      }
    }
    if (options?.extraMatch && !options.extraMatch(row)) {
      return false;
    }
    if (filters.search && options?.searchFields && !searchTerms(options.searchFields(row), filters.search)) {
      return false;
    }
    return true;
  });
}

export function filterPositions(state: DashboardState, filters: DashboardFilters) {
  return applyCommonFilters(state.positions, filters, {
    searchFields: (row) => [row.name, row.technology, row.vertical, row.remarks],
    dateField: (row) => row.openDate,
  });
}

export function filterInterviews(state: DashboardState, filters: DashboardFilters) {
  const baseRows = applyCommonFilters(state.interviews, filters, {
    dateField: (row) => row.interviewDate,
  });

  const normalizedSearch = filters.search.trim().toLowerCase();
  if (!normalizedSearch) {
    return baseRows;
  }

  const lookups = createLookups(state);
  return baseRows.filter((row) => {
    const candidate = lookups.candidates.get(row.candidateId);
    const position = lookups.positions.get(row.positionId);
    const client = lookups.clients.get(row.clientId);
    const recruiter = lookups.recruiters.get(row.recruiterId);
    const spocId = candidate?.spocId ?? position?.spocId;
    const spoc = spocId ? lookups.spocs.get(spocId) : undefined;

    return [
      candidate?.name,
      candidate?.contactNo,
      position?.name,
      position?.technology,
      client?.name,
      spoc?.name,
      recruiter?.name,
      row.round,
      row.status,
      row.time,
      row.remarks,
      row.interviewDate,
    ].some((value) => `${value ?? ""}`.toLowerCase().includes(normalizedSearch));
  });
}

export function filterCandidates(state: DashboardState, filters: DashboardFilters) {
  return applyCommonFilters(state.candidates, filters, {
    searchFields: (row) => [row.name, row.technology, row.source, row.remarks],
    dateField: (row) => row.submittedAt,
  });
}

export function filterOffers(state: DashboardState, filters: DashboardFilters) {
  return applyCommonFilters(state.offers, filters, {
    searchFields: (row) => [row.remarks, row.ctc],
    dateField: (row) => row.offerDate,
  });
}

export function filterJoinings(state: DashboardState, filters: DashboardFilters) {
  return applyCommonFilters(state.joinings, filters, {
    searchFields: (row) => [row.remarks, row.status],
    dateField: (row) => row.joiningDate,
  });
}

export function filterActivity(state: DashboardState, filters: DashboardFilters) {
  const normalized = filters.search.trim().toLowerCase();
  return state.activityLog.filter((item) => {
    if (!normalized) {
      return true;
    }
    return [item.actorName, item.action, item.entityName, item.description]
      .some((value) => value.toLowerCase().includes(normalized));
  });
}

export function getActivePositions(state: DashboardState, filters: DashboardFilters) {
  return filterPositions(state, filters).filter((position) => position.status !== "Closed");
}

export function getPositionsOnHold(state: DashboardState, filters: DashboardFilters) {
  return filterPositions(state, filters).filter((position) => position.status === "On Hold");
}

export function getTodayInterviews(state: DashboardState, filters: DashboardFilters) {
  const todayKey = new Date().toISOString().slice(0, 10);
  return filterInterviews(state, filters).filter((item) => item.interviewDate.slice(0, 10) === todayKey);
}

export function getPendingInterviews(state: DashboardState, filters: DashboardFilters) {
  const terminalStatuses = new Set<DashboardState["interviews"][number]["status"]>(["L1 Done", "L1 Select", "L1 Reject", "L2 Done", "L2 Select", "L2 Reject", "CI Round Done", "CI Reject", "Final Select", "No Show", "Panel No Show", "Cancelled"]);
  return filterInterviews(state, filters).filter((item) => !terminalStatuses.has(item.status));
}

export function getFinalSelectionCandidates(state: DashboardState, filters: DashboardFilters) {
  return filterCandidates(state, filters).filter((candidate) => candidate.stage === "Final Selection" || candidate.stage === "Offer");
}

export function getSelectionCandidates(state: DashboardState, filters: DashboardFilters) {
  return filterCandidates(state, filters).filter((candidate) => candidate.stage === "Offer" || candidate.stage === "Joined");
}

export function getCurrentMonthKey() {
  return monthKey(new Date());
}

export function groupByMonth(values: Array<{ submittedAt?: string; interviewDate?: string; offerDate?: string; joiningDate?: string }>, field: "submittedAt" | "interviewDate" | "offerDate" | "joiningDate") {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const raw = value[field];
    if (!raw) {
      return;
    }
    const key = monthKey(raw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      key,
      label: formatMonthLabel(key),
      count,
    }));
}

export function createConversionSummary(state: DashboardState, filters: DashboardFilters) {
  const candidates = filterCandidates(state, filters);
  const interviews = filterInterviews(state, filters);
  const offers = filterOffers(state, filters);
  const joinings = filterJoinings(state, filters);

  const interviewConversion = candidates.length === 0 ? 0 : Math.round((interviews.length / candidates.length) * 100);
  const selectionConversion = interviews.length === 0 ? 0 : Math.round((candidates.filter((candidate) => candidate.stage === "Final Selection").length / interviews.length) * 100);
  const offerConversion = candidates.filter((candidate) => candidate.stage === "Final Selection").length === 0
    ? 0
    : Math.round((offers.filter((offer) => offer.status === "Accepted" || offer.status === "Sent").length / candidates.filter((candidate) => candidate.stage === "Final Selection").length) * 100);
  const joiningConversion = offers.length === 0 ? 0 : Math.round((joinings.filter((joining) => joining.status === "Joined").length / offers.length) * 100);

  return [
    { label: "Interview", value: interviewConversion },
    { label: "Selection", value: selectionConversion },
    { label: "Offer", value: offerConversion },
    { label: "Joining", value: joiningConversion },
  ];
}

export function createLeaderboard(state: DashboardState, filters: DashboardFilters) {
  const filteredCandidates = filterCandidates(state, filters);
  const filteredInterviews = filterInterviews(state, filters);
  const filteredOffers = filterOffers(state, filters);
  const filteredJoinings = filterJoinings(state, filters);

  const candidatesByRecruiter = groupByKey(filteredCandidates, (r) => r.recruiterId);
  const interviewsByRecruiter = groupByKey(filteredInterviews, (r) => r.recruiterId);
  const offersByRecruiter = groupByKey(filteredOffers, (r) => r.recruiterId);
  const joiningsByRecruiter = groupByKey(filteredJoinings, (r) => r.recruiterId);

  return state.recruiters
    .map((recruiter) => {
      const recruiterCandidates = candidatesByRecruiter.get(recruiter.id)?.length ?? 0;
      const recruiterInterviews = interviewsByRecruiter.get(recruiter.id)?.length ?? 0;
      const recruiterOffers = offersByRecruiter.get(recruiter.id)?.length ?? 0;
      const recruiterJoinings = joiningsByRecruiter.get(recruiter.id)?.length ?? 0;
      const total = recruiterCandidates + recruiterInterviews + recruiterOffers + recruiterJoinings;
      const achievement = recruiter.target === 0 ? 0 : Math.round((recruiterJoinings / recruiter.target) * 100);
      return {
        ...recruiter,
        candidates: recruiterCandidates,
        interviews: recruiterInterviews,
        offers: recruiterOffers,
        joinings: recruiterJoinings,
        total,
        achievement,
      };
    })
    .sort((left, right) => right.achievement - left.achievement);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupByKey<T extends Record<string, any>>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    let arr = map.get(key);
    if (!arr) { arr = []; map.set(key, arr); }
    arr.push(item);
  }
  return map;
}

export function filterByMonth<T extends { submittedAt?: string; interviewDate?: string; offerDate?: string; joiningDate?: string }>(
  rows: T[],
  month: string,
  field: "submittedAt" | "interviewDate" | "offerDate" | "joiningDate"
) {
  return rows.filter((row) => {
    const value = row[field];
    if (!value) {
      return false;
    }
    return monthKey(value) === month;
  });
}

export function getLatestActivity(state: DashboardState, filters: DashboardFilters) {
  return filterActivity(state, filters)
    .slice()
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 8);
}

export interface AgingPipelineItem {
  type: "offer" | "candidate" | "interview";
  id: string;
  label: string;
  detail: string;
  daysSince: number;
  severity: "amber" | "red";
}

export function getAgingPipeline(state: DashboardState): AgingPipelineItem[] {
  const lookups = createLookups(state);
  const items: AgingPipelineItem[] = [];
  const now = Date.now();

  state.offers
    .filter((o) => o.selectionStatus === "Joining Pending")
    .forEach((offer) => {
      const days = Math.floor((now - new Date(offer.offerDate).getTime()) / (1000 * 60 * 60 * 24));
      if (days > 30) {
        const candidate = lookups.candidates.get(offer.candidateId);
        const client = lookups.clients.get(offer.clientId);
        items.push({
          type: "offer", id: offer.id,
          label: candidate?.name ?? "Unknown",
          detail: client?.name ?? "Unknown",
          daysSince: days, severity: "red",
        });
      }
    });

  state.candidates
    .filter((c) => c.stage === "Final Selection")
    .forEach((candidate) => {
      const date = candidate.finalSelectDate || candidate.submittedAt;
      const days = Math.floor((now - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
      if (days > 14) {
        const position = lookups.positions.get(candidate.positionId);
        items.push({
          type: "candidate", id: candidate.id,
          label: candidate.name,
          detail: position?.name ?? "Unknown",
          daysSince: days, severity: "amber",
        });
      }
    });

  return items.sort((a, b) => b.daysSince - a.daysSince).slice(0, 6);
}

function parseTimeToMinutes(time: string): number {
  const [timePart, period] = time.split(" ");
  if (!timePart) return 0;
  let [h, m] = timePart.split(":").map(Number);
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h * 60 + (m ?? 0);
}

export interface UpcomingInterview {
  id: string;
  candidateName: string;
  round: string;
  time: string;
  positionName: string;
  minutesUntil: number;
  urgency: "urgent" | "soon" | "later";
  status: string;
}

export function getUpcomingInterviews(state: DashboardState): UpcomingInterview[] {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const lookups = createLookups(state);

  return state.interviews
    .filter((i) => i.interviewDate.slice(0, 10) === todayKey && !doneInterviewStatuses.has(i.status))
    .map((i) => {
      const minutes = parseTimeToMinutes(i.time);
      const diff = minutes - currentMinutes;
      const candidate = lookups.candidates.get(i.candidateId);
      const position = lookups.positions.get(i.positionId);
      return {
        id: i.id,
        candidateName: candidate?.name ?? "Unknown",
        round: i.round,
        time: i.time,
        positionName: position?.name ?? "Unknown",
        minutesUntil: diff,
        urgency: diff < 60 ? "urgent" as const : diff < 180 ? "soon" as const : "later" as const,
        status: i.status,
      };
    })
    .filter((i) => i.minutesUntil > 0 && i.minutesUntil < 480)
    .sort((a, b) => a.minutesUntil - b.minutesUntil)
    .slice(0, 4);
}

export interface InterviewRoundBreakdown {
  round: string;
  scheduled: number;
  done: number;
  total: number;
}

export function getInterviewRoundBreakdown(state: DashboardState): InterviewRoundBreakdown[] {
  const roundMap = new Map<string, { scheduled: number; done: number }>();
  state.interviews
    .filter((i) => i.status !== "Cancelled")
    .forEach((i) => {
      const roundKey = i.round.replace(/ .*$/, "");
      const entry = roundMap.get(roundKey) ?? { scheduled: 0, done: 0 };
      if (i.status.endsWith("Scheduled")) entry.scheduled++;
      if (doneInterviewStatuses.has(i.status)) entry.done++;
      roundMap.set(roundKey, entry);
    });
  return Array.from(roundMap.entries())
    .map(([round, counts]) => ({ round, ...counts, total: counts.scheduled + counts.done }))
    .sort((a, b) => b.total - a.total);
}

export function groupPositionStatus(state: DashboardState, filters: DashboardFilters) {
  const positions = filterPositions(state, filters);
  const counts = new Map<string, number>();
  positions.forEach((position) => {
    counts.set(position.status, (counts.get(position.status) ?? 0) + 1);
  });
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

export function groupRecruiterPerformance(state: DashboardState, filters: DashboardFilters) {
  return state.recruiters.map((recruiter) => {
    const candidates = filterCandidates(state, { ...filters, recruiterId: recruiter.id });
    return {
      name: recruiter.name,
      cvCount: candidates.length,
      interviewCount: filterInterviews(state, { ...filters, recruiterId: recruiter.id }).length,
      finalCount: candidates.filter((candidate) => candidate.stage === "Final Selection" || candidate.stage === "Offer" || candidate.stage === "Joined").length,
      offerCount: filterOffers(state, { ...filters, recruiterId: recruiter.id }).length,
      joinedCount: filterJoinings(state, { ...filters, recruiterId: recruiter.id }).filter((joining) => joining.status === "Joined").length,
      target: recruiter.target,
    };
  });
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function isThisWeek(dateStr: string) {
  const { monday, sunday } = getWeekRange();
  const date = new Date(dateStr);
  return date >= monday && date <= sunday;
}

function getCvSharedEntryForMonth(state: DashboardState, month: string, clientId: string) {
  return state.cvSharedEntries.find((e) => e.month === month && e.clientId === clientId);
}

export interface ClientHomeMetrics {
  clientId: string;
  clientName: string;
  clientIndustry: string;
  cvSharedMonth: number;
  cvSharedWeek: number;
  cvSharedEntryId: string | null;
  interviewsDoneMonth: number;
  interviewsDoneWeek: number;
  finalSelectMonth: number;
  finalSelectWeek: number;
  joinedMonth: number;
  joinedWeek: number;
}

const doneInterviewStatuses = new Set(["L1 Done", "L2 Done", "CI Round Done", "CI Reject", "L1 Select", "L2 Select", "L1 Reject", "L2 Reject", "Final Select", "No Show", "Panel No Show", "Cancelled"]);

export function getHomeMetrics(state: DashboardState, selectedMonth: string): ClientHomeMetrics[] {
  const interviewsByClient = new Map<string, typeof state.interviews>();
  const candidatesByClient = new Map<string, typeof state.candidates>();
  const joiningsByClient = new Map<string, typeof state.joinings>();
  const cvSharedByClient = new Map<string, typeof state.cvSharedEntries>();

  for (const i of state.interviews) {
    let arr = interviewsByClient.get(i.clientId);
    if (!arr) { arr = []; interviewsByClient.set(i.clientId, arr); }
    arr.push(i);
  }
  for (const c of state.candidates) {
    let arr = candidatesByClient.get(c.clientId);
    if (!arr) { arr = []; candidatesByClient.set(c.clientId, arr); }
    arr.push(c);
  }
  for (const j of state.joinings) {
    let arr = joiningsByClient.get(j.clientId);
    if (!arr) { arr = []; joiningsByClient.set(j.clientId, arr); }
    arr.push(j);
  }
  for (const e of state.cvSharedEntries) {
    let arr = cvSharedByClient.get(e.clientId);
    if (!arr) { arr = []; cvSharedByClient.set(e.clientId, arr); }
    arr.push(e);
  }

  return state.clients.map((client) => {
    const clientInterviews = interviewsByClient.get(client.id) ?? [];
    const clientCandidates = candidatesByClient.get(client.id) ?? [];
    const clientJoinings = joiningsByClient.get(client.id) ?? [];
    const clientCvShared = cvSharedByClient.get(client.id) ?? [];
    const cvSharedEntry = clientCvShared.find((e) => e.month === selectedMonth) ?? null;

    return {
      clientId: client.id,
      clientName: client.name,
      clientIndustry: client.industry,
      cvSharedMonth: cvSharedEntry?.count ?? 0,
      cvSharedWeek: clientCvShared.reduce((sum, e) => sum + e.count, 0),
      cvSharedEntryId: cvSharedEntry?.id ?? null,
      interviewsDoneMonth: clientInterviews.filter(
        (i) => doneInterviewStatuses.has(i.status) && monthKey(i.interviewDate) === selectedMonth
      ).length,
      interviewsDoneWeek: clientInterviews.filter(
        (i) => doneInterviewStatuses.has(i.status) && isThisWeek(i.interviewDate)
      ).length,
      finalSelectMonth: clientCandidates.filter(
        (c) => monthKey(c.submittedAt) === selectedMonth && c.stage === "Final Selection"
      ).length,
      finalSelectWeek: clientCandidates.filter(
        (c) => isThisWeek(c.submittedAt) && c.stage === "Final Selection"
      ).length,
      joinedMonth: clientJoinings.filter(
        (j) => j.status === "Joined" && monthKey(j.joiningDate) === selectedMonth
      ).length,
      joinedWeek: clientJoinings.filter(
        (j) => j.status === "Joined" && isThisWeek(j.joiningDate)
      ).length,
    };
  });
}

export function getMonthCounts(state: DashboardState, month: string) {
  const cvShared = state.cvSharedEntries
    .filter((e) => e.month === month)
    .reduce((sum, e) => sum + e.count, 0);
  const interviewsDone = state.interviews.filter(
    (i) => doneInterviewStatuses.has(i.status) && monthKey(i.interviewDate) === month
  ).length;
  const finalSelects = state.candidates.filter(
    (c) => c.stage === "Final Selection" && monthKey(c.submittedAt) === month
  ).length;
  const joined = state.joinings.filter(
    (j) => j.status === "Joined" && monthKey(j.joiningDate) === month
  ).length;
  return { cvShared, interviewsDone, finalSelects, joined };
}

export interface DashboardFunnel {
  cvShared: number;
  interviewsDone: number;
  finalSelects: number;
  joined: number;
  cvToIntPct: number;
  intToFinalPct: number;
  finalToJoinedPct: number;
  cvClientCount: number;
  interviewPositionCount: number;
  finalSelectClientCount: number;
  joinedRevenue: number;
}

function filterByMonthOrAll<T extends { submittedAt?: string; interviewDate?: string; offerDate?: string; joiningDate?: string }>(
  rows: T[],
  month: string | "all",
  field: "submittedAt" | "interviewDate" | "offerDate" | "joiningDate"
) {
  if (month === "all") return rows;
  return rows.filter((row) => {
    const value = row[field];
    if (!value) return false;
    return monthKey(value) === month;
  });
}

export function getDashboardFunnel(state: DashboardState, selectedMonth: string | "all"): DashboardFunnel {
  const isAll = selectedMonth === "all";
  const cvShared = isAll
    ? state.cvSharedEntries.reduce((sum, e) => sum + e.count, 0)
    : getMonthCounts(state, selectedMonth).cvShared;
  const interviewsDone = isAll
    ? state.interviews.filter((i) => doneInterviewStatuses.has(i.status)).length
    : getMonthCounts(state, selectedMonth).interviewsDone;
  const finalSelects = isAll
    ? state.candidates.filter((c) => c.stage === "Final Selection").length
    : getMonthCounts(state, selectedMonth).finalSelects;
  const joined = isAll
    ? state.joinings.filter((j) => j.status === "Joined").length
    : getMonthCounts(state, selectedMonth).joined;

  const cvEntries = isAll
    ? state.cvSharedEntries
    : state.cvSharedEntries.filter((e) => e.month === selectedMonth);
  const cvClientCount = new Set(cvEntries.map((e) => e.clientId)).size;

  const interviewRows = isAll
    ? state.interviews.filter((i) => doneInterviewStatuses.has(i.status))
    : state.interviews.filter((i) => doneInterviewStatuses.has(i.status) && monthKey(i.interviewDate) === selectedMonth);
  const interviewPositionCount = new Set(interviewRows.map((i) => i.positionId)).size;

  const fsCandidates = isAll
    ? state.candidates.filter((c) => c.stage === "Final Selection")
    : state.candidates.filter((c) => c.stage === "Final Selection" && monthKey(c.submittedAt) === selectedMonth);
  const finalSelectClientCount = new Set(fsCandidates.map((c) => c.clientId)).size;

  const joinedJoinings = isAll
    ? state.joinings.filter((j) => j.status === "Joined")
    : state.joinings.filter((j) => j.status === "Joined" && monthKey(j.joiningDate) === selectedMonth);
  const joinedCandidateIds = new Set(joinedJoinings.map((j) => j.candidateId));
  const joinedRevenue = state.offers
    .filter((o) => joinedCandidateIds.has(o.candidateId))
    .reduce((sum, o) => sum + o.billValue, 0);

  return {
    cvShared, interviewsDone, finalSelects, joined,
    cvToIntPct: cvShared === 0 ? 0 : Math.round((interviewsDone / cvShared) * 100),
    intToFinalPct: interviewsDone === 0 ? 0 : Math.round((finalSelects / interviewsDone) * 100),
    finalToJoinedPct: finalSelects === 0 ? 0 : Math.round((joined / finalSelects) * 100),
    cvClientCount, interviewPositionCount, finalSelectClientCount, joinedRevenue,
  };
}

export interface MomTrendItem {
  month: string;
  label: string;
  cvShared: number;
  interviewsDone: number;
  finalSelects: number;
  joined: number;
}

export function getMomTrends(state: DashboardState): MomTrendItem[] {
  const months: MomTrendItem[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
    const counts = getMonthCounts(state, key);
    months.push({
      month: key,
      label: formatMonthLabel(key),
      ...counts,
    });
  }
  return months;
}

export interface MomChange {
  cvShared: number;
  interviewsDone: number;
  finalSelects: number;
  joined: number;
}

export function getMomChange(state: DashboardState, selectedMonth: string): MomChange {
  const [year, month] = selectedMonth.split("-").map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${`${prevDate.getMonth() + 1}`.padStart(2, "0")}`;
  const current = getMonthCounts(state, selectedMonth);
  const previous = getMonthCounts(state, prevMonth);
  return {
    cvShared: previous.cvShared === 0 ? 0 : Math.round(((current.cvShared - previous.cvShared) / previous.cvShared) * 100),
    interviewsDone: previous.interviewsDone === 0 ? 0 : Math.round(((current.interviewsDone - previous.interviewsDone) / previous.interviewsDone) * 100),
    finalSelects: previous.finalSelects === 0 ? 0 : Math.round(((current.finalSelects - previous.finalSelects) / previous.finalSelects) * 100),
    joined: previous.joined === 0 ? 0 : Math.round(((current.joined - previous.joined) / previous.joined) * 100),
  };
}

export interface WeekSummary {
  cvShared: number;
  interviewsDone: number;
  finalSelects: number;
  joined: number;
}

export function getWeekSummary(state: DashboardState): WeekSummary {
  const interviewsDone = state.interviews.filter(
    (i) => doneInterviewStatuses.has(i.status) && isThisWeek(i.interviewDate)
  ).length;
  const finalSelects = state.candidates.filter(
    (c) => c.stage === "Final Selection" && isThisWeek(c.submittedAt)
  ).length;
  const joined = state.joinings.filter(
    (j) => j.status === "Joined" && isThisWeek(j.joiningDate)
  ).length;
  const currentMonth = monthKey(new Date());
  const cvShared = state.cvSharedEntries
    .filter((e) => e.month === currentMonth)
    .reduce((sum, e) => sum + e.count, 0);
  return {
    cvShared: Math.round(cvShared / 4.33),
    interviewsDone,
    finalSelects,
    joined,
  };
}

function getPreviousWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + diff);
  thisMonday.setHours(0, 0, 0, 0);
  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(thisMonday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  prevSunday.setHours(23, 59, 59, 999);
  return { monday: prevMonday, sunday: prevSunday };
}

function isPreviousWeek(dateStr: string) {
  const { monday, sunday } = getPreviousWeekRange();
  const date = new Date(dateStr);
  return date >= monday && date <= sunday;
}

export function getLastWeekSummary(state: DashboardState): WeekSummary {
  const interviewsDone = state.interviews.filter(
    (i) => doneInterviewStatuses.has(i.status) && isPreviousWeek(i.interviewDate)
  ).length;
  const finalSelects = state.candidates.filter(
    (c) => c.stage === "Final Selection" && isPreviousWeek(c.submittedAt)
  ).length;
  const joined = state.joinings.filter(
    (j) => j.status === "Joined" && isPreviousWeek(j.joiningDate)
  ).length;
  return { cvShared: 0, interviewsDone, finalSelects, joined };
}

export interface RecruiterPerformanceRow {
  id: string;
  name: string;
  vertical: string;
  target: number;
  cvCount: number;
  interviewCount: number;
  offerCount: number;
  joinedCount: number;
  cvToInterviewPct: number;
  interviewToOfferPct: number;
  offerToJoinPct: number;
  achievementPct: number;
  totalBillings: number;
}

export function getRecruiterPerformanceExtended(state: DashboardState, filters: DashboardFilters): RecruiterPerformanceRow[] {
  const candidatesByRecruiter = groupByKey(filterCandidates(state, filters), (r) => r.recruiterId);
  const interviewsByRecruiter = groupByKey(filterInterviews(state, filters), (r) => r.recruiterId);
  const offersByRecruiter = groupByKey(filterOffers(state, filters), (r) => r.recruiterId);
  const joiningsByRecruiter = groupByKey(filterJoinings(state, filters).filter((j) => j.status === "Joined"), (r) => r.recruiterId);

  return state.recruiters.map((recruiter) => {
    const candidates = candidatesByRecruiter.get(recruiter.id) ?? [];
    const interviews = interviewsByRecruiter.get(recruiter.id) ?? [];
    const offers = offersByRecruiter.get(recruiter.id) ?? [];
    const joinings = joiningsByRecruiter.get(recruiter.id) ?? [];
    const cvCount = candidates.length;
    const interviewCount = interviews.length;
    const offerCount = offers.length;
    const joinedCount = joinings.length;
    const preOfferLoseCandidateIds = new Set(
      candidates.filter((c) => PRE_OFFER_LOSE_STATUSES.has(c.finalSelectStatus)).map((c) => c.id)
    );
    const totalBillings = offers
      .filter((o) => joinings.some((j) => j.candidateId === o.candidateId) && !preOfferLoseCandidateIds.has(o.candidateId))
      .reduce((sum, o) => sum + o.billValue, 0);
    return {
      id: recruiter.id,
      name: recruiter.name,
      vertical: recruiter.vertical,
      target: recruiter.target,
      cvCount,
      interviewCount,
      offerCount,
      joinedCount,
      cvToInterviewPct: cvCount === 0 ? 0 : Math.round((interviewCount / cvCount) * 100),
      interviewToOfferPct: interviewCount === 0 ? 0 : Math.round((offerCount / interviewCount) * 100),
      offerToJoinPct: offerCount === 0 ? 0 : Math.round((joinedCount / offerCount) * 100),
      achievementPct: recruiter.target === 0 ? 0 : Math.round((joinedCount / recruiter.target) * 100),
      totalBillings,
    };
  }).sort((a, b) => b.joinedCount - a.joinedCount || b.offerCount - a.offerCount);
}

export interface RevenueMetrics {
  totalRevenue: number;
  totalProduction: number;
  pipelineValue: number;
  currentMonthRevenue: number;
  currentMonthProduction: number;
  monthlyTrends: Array<{ month: string; label: string; revenue: number; production: number }>;
}

const PRE_OFFER_LOSE_STATUSES = new Set(["Pre Offer Lose", "Client Reject", "Drop", "BGV Reject"]);

export function getRevenueMetrics(state: DashboardState, selectedMonth: string): RevenueMetrics {
  const joinedJoinings = state.joinings.filter((j) => j.status === "Joined");
  const joinedCandidateIds = new Set(joinedJoinings.map((j) => j.candidateId));

  const revenueOffers = state.offers.filter((o) => joinedCandidateIds.has(o.candidateId));
  const totalRevenue = revenueOffers.reduce((sum, o) => sum + o.billValue, 0);

  const preOfferLoseCandidateIds = new Set(
    state.candidates
      .filter((c) => PRE_OFFER_LOSE_STATUSES.has(c.finalSelectStatus))
      .map((c) => c.id)
  );
  const totalProduction = state.offers
    .filter((o) => o.offerDate && !preOfferLoseCandidateIds.has(o.candidateId))
    .reduce((sum, o) => sum + o.billValue, 0);

  const pendingOffers = state.offers.filter((o) => o.selectionStatus === "Joining Pending");
  const pipelineValue = pendingOffers.reduce((sum, o) => sum + o.billValue, 0);

  const currentMonthJoinings = joinedJoinings.filter((j) => monthKey(j.joiningDate) === selectedMonth);
  const currentMonthOfferIds = new Set(currentMonthJoinings.map((j) => j.candidateId));
  const currentMonthRevenue = state.offers
    .filter((o) => currentMonthOfferIds.has(o.candidateId))
    .reduce((sum, o) => sum + o.billValue, 0);

  const currentMonthProduction = state.offers
    .filter((o) => o.offerDate && monthKey(o.offerDate) === selectedMonth && !preOfferLoseCandidateIds.has(o.candidateId))
    .reduce((sum, o) => sum + o.billValue, 0);

  const now = new Date();
  const monthlyTrends: RevenueMetrics["monthlyTrends"] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
    const monthJoinings = joinedJoinings.filter((j) => monthKey(j.joiningDate) === key);
    const monthOfferIds = new Set(monthJoinings.map((j) => j.candidateId));
    const revenue = state.offers
      .filter((o) => monthOfferIds.has(o.candidateId))
      .reduce((sum, o) => sum + o.billValue, 0);
    const production = state.offers
      .filter((o) => o.offerDate && monthKey(o.offerDate) === key && !preOfferLoseCandidateIds.has(o.candidateId))
      .reduce((sum, o) => sum + o.billValue, 0);
    monthlyTrends.push({ month: key, label: formatMonthLabel(key), revenue, production });
  }

  return {
    totalRevenue,
    totalProduction,
    pipelineValue,
    currentMonthRevenue,
    currentMonthProduction,
    monthlyTrends,
  };
}

export interface ProductionPipelineRow {
  candidateName: string;
  clientName: string;
  positionName: string;
  offeredCtc: number;
  billValue: number;
  joiningDate: string;
  daysUntilJoining: number;
  selectionStatus: string;
}

export function getProductionPipeline(state: DashboardState): ProductionPipelineRow[] {
  const lookups = createLookups(state);
  const joiningsByCandidate = new Map(state.joinings.map((j) => [j.candidateId, j]));
  return state.offers
    .filter((o) => o.selectionStatus === "Joining Pending")
    .map((offer) => {
      const client = lookups.clients.get(offer.clientId);
      const position = lookups.positions.get(offer.positionId);
      const joining = joiningsByCandidate.get(offer.candidateId);
      const daysUntilJoining = joining?.joiningDate
        ? Math.floor((new Date(joining.joiningDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        candidateName: lookups.candidates.get(offer.candidateId)?.name ?? "Unknown",
        clientName: client?.name ?? "Unknown",
        positionName: position?.name ?? "Unknown",
        offeredCtc: offer.ctc,
        billValue: offer.billValue,
        joiningDate: joining?.joiningDate ?? "",
        daysUntilJoining,
        selectionStatus: offer.selectionStatus,
      };
    });
}

export interface LeaderboardRow {
  recruiterId: string;
  name: string;
  cvCount: number;
}

export function getWeeklyLeaderboard(state: DashboardState): LeaderboardRow[] {
  return state.recruiters.map((r) => ({
    recruiterId: r.id,
    name: r.name,
    cvCount: state.candidates.filter((c) => c.recruiterId === r.id && isThisWeek(c.submittedAt)).length,
  })).sort((a, b) => b.cvCount - a.cvCount);
}

export function getMonthlyLeaderboard(state: DashboardState, selectedMonth: string): LeaderboardRow[] {
  return state.recruiters.map((r) => ({
    recruiterId: r.id,
    name: r.name,
    cvCount: state.candidates.filter((c) => c.recruiterId === r.id && monthKey(c.submittedAt) === selectedMonth).length,
  })).sort((a, b) => b.cvCount - a.cvCount);
}

export interface DetailedRecruiterRow {
  id: string;
  name: string;
  cvCount: number;
  interviewCount: number;
  finalSelectCount: number;
  joinedCount: number;
  cvToIntPct: number;
}

export function getDetailedRecruiterReport(state: DashboardState, filters: DashboardFilters): DetailedRecruiterRow[] {
  return state.recruiters.map((recruiter) => {
    const rFilters = { ...filters, recruiterId: recruiter.id };
    const candidates = filterCandidates(state, rFilters);
    const interviews = filterInterviews(state, rFilters);
    const cvCount = candidates.length;
    const interviewCount = interviews.length;
    return {
      id: recruiter.id,
      name: recruiter.name,
      cvCount,
      interviewCount,
      finalSelectCount: candidates.filter((c) => c.stage === "Final Selection" || c.stage === "Offer").length,
      joinedCount: filterJoinings(state, rFilters).filter((j) => j.status === "Joined").length,
      cvToIntPct: cvCount === 0 ? 0 : Math.round((interviewCount / cvCount) * 100),
    };
  }).sort((a, b) => b.cvCount - a.cvCount);
}

export interface ProductiveDay {
  topCvDay: string;
  topCvCount: number;
  topInterviewDay: string;
  topInterviewCount: number;
}

export function getProductiveDays(state: DashboardState, selectedMonth: string): ProductiveDay {
  const cvByDay = new Map<string, number>();
  const intByDay = new Map<string, number>();

  state.candidates
    .filter((c) => monthKey(c.submittedAt) === selectedMonth)
    .forEach((c) => {
      const day = c.submittedAt.slice(0, 10);
      cvByDay.set(day, (cvByDay.get(day) ?? 0) + 1);
    });

  state.interviews
    .filter((i) => monthKey(i.interviewDate) === selectedMonth)
    .forEach((i) => {
      const day = i.interviewDate.slice(0, 10);
      intByDay.set(day, (intByDay.get(day) ?? 0) + 1);
    });

  let topCvDay = "—", topCvCount = 0;
  let topInterviewDay = "—", topInterviewCount = 0;

  cvByDay.forEach((count, day) => {
    if (count > topCvCount) { topCvCount = count; topCvDay = day; }
  });
  intByDay.forEach((count, day) => {
    if (count > topInterviewCount) { topInterviewCount = count; topInterviewDay = day; }
  });

  return { topCvDay, topCvCount, topInterviewDay, topInterviewCount };
}

const activeInterviewStatuses = new Set([
  "L1 Scheduled", "L1 Done", "L1 Select", "L1 Reject",
  "L2 Scheduled", "L2 Done", "L2 Select", "L2 Reject",
  "CI Round Scheduled", "CI Round Done", "CI Reject", "Final Select",
]);

export interface MonthSnapshot {
  cvCount: number;
  interviewCount: number;
  finalSelectCount: number;
  selectionCount: number;
  conversionRate: number;
}

export function getMonthSnapshot(state: DashboardState, month: string): MonthSnapshot {
  const cvCount = state.candidates.filter((c) => monthKey(c.submittedAt) === month).length;
  const interviewCount = state.interviews.filter(
    (i) => activeInterviewStatuses.has(i.status) && monthKey(i.interviewDate) === month
  ).length;
  const finalSelectCount = state.candidates.filter(
    (c) => (c.stage === "Final Selection" || c.stage === "Offer") && monthKey(c.submittedAt) === month
  ).length;
  const selectionCount = state.offers.filter(
    (o) => o.status === "Accepted" && monthKey(o.offerDate) === month
  ).length;
  const conversionRate = cvCount === 0 ? 0 : Math.round((interviewCount / cvCount) * 100);
  return { cvCount, interviewCount, finalSelectCount, selectionCount, conversionRate };
}

export interface WorstProductiveDay {
  topCvDay: string;
  topCvCount: number;
  lowestCvDay: string;
  lowestCvCount: number;
  topInterviewDay: string;
  topInterviewCount: number;
}

export function getWorstProductiveDay(state: DashboardState, selectedMonth: string): WorstProductiveDay {
  const cvByDay = new Map<string, number>();
  const intByDay = new Map<string, number>();

  state.candidates
    .filter((c) => monthKey(c.submittedAt) === selectedMonth)
    .forEach((c) => {
      const day = c.submittedAt.slice(0, 10);
      cvByDay.set(day, (cvByDay.get(day) ?? 0) + 1);
    });

  state.interviews
    .filter((i) => monthKey(i.interviewDate) === selectedMonth)
    .forEach((i) => {
      const day = i.interviewDate.slice(0, 10);
      intByDay.set(day, (intByDay.get(day) ?? 0) + 1);
    });

  let topCvDay = "—", topCvCount = 0;
  let lowestCvDay = "—", lowestCvCount = Infinity;
  let topInterviewDay = "—", topInterviewCount = 0;

  cvByDay.forEach((count, day) => {
    if (count > topCvCount) { topCvCount = count; topCvDay = day; }
    if (count < lowestCvCount) { lowestCvCount = count; lowestCvDay = day; }
  });
  intByDay.forEach((count, day) => {
    if (count > topInterviewCount) { topInterviewCount = count; topInterviewDay = day; }
  });

  if (lowestCvCount === Infinity) { lowestCvCount = 0; lowestCvDay = "—"; }

  return { topCvDay, topCvCount, lowestCvDay, lowestCvCount, topInterviewDay, topInterviewCount };
}

export interface DailyCvRow {
  recruiterId: string;
  recruiterName: string;
  cvCount: number;
}

export function getDailyCvReport(state: DashboardState, date: string): DailyCvRow[] {
  const map = new Map<string, { name: string; count: number }>();
  state.recruiters.forEach((r) => map.set(r.id, { name: r.name, count: 0 }));
  state.candidates
    .filter((c) => c.submittedAt.slice(0, 10) === date)
    .forEach((c) => {
      const entry = map.get(c.recruiterId);
      if (entry) entry.count++;
    });
  return Array.from(map, ([recruiterId, { name, count }]) => ({ recruiterId, recruiterName: name, cvCount: count }))
    .sort((a, b) => b.cvCount - a.cvCount);
}

export interface RecruiterPeriodStats {
  cvCount: number;
  l1Interviews: number;
  l2Interviews: number;
  ciRounds: number;
  finalSelectCount: number;
  selectionCount: number;
  joinedCount: number;
  production: number;
  revenue: number;
  achievementPct: number;
}

export interface RecruiterProfileDetail {
  id: string;
  name: string;
  vertical: string;
  target: number;
  month: RecruiterPeriodStats;
  allTime: RecruiterPeriodStats;
  momTrend: Array<{ month: string; label: string; cvCount: number }>;
}

function buildRecruiterPeriodStats(
  state: DashboardState,
  recruiterId: string,
  monthFilter?: string
): RecruiterPeriodStats {
  const candidates = monthFilter
    ? state.candidates.filter((c) => c.recruiterId === recruiterId && monthKey(c.submittedAt) === monthFilter)
    : state.candidates.filter((c) => c.recruiterId === recruiterId);
  const interviews = monthFilter
    ? state.interviews.filter((i) => i.recruiterId === recruiterId && monthKey(i.interviewDate) === monthFilter)
    : state.interviews.filter((i) => i.recruiterId === recruiterId);
  const offers = monthFilter
    ? state.offers.filter((o) => o.recruiterId === recruiterId && monthKey(o.offerDate) === monthFilter)
    : state.offers.filter((o) => o.recruiterId === recruiterId);
  const joinings = monthFilter
    ? state.joinings.filter((j) => j.recruiterId === recruiterId && monthKey(j.joiningDate) === monthFilter)
    : state.joinings.filter((j) => j.recruiterId === recruiterId);

  const cvCount = candidates.length;
  const l1Interviews = interviews.filter((i) => i.round === "L1" && activeInterviewStatuses.has(i.status)).length;
  const l2Interviews = interviews.filter((i) => i.round === "L2" && activeInterviewStatuses.has(i.status)).length;
  const ciRounds = interviews.filter((i) => i.round === "CI" && activeInterviewStatuses.has(i.status)).length;
  const finalSelectCount = candidates.filter(
    (c) => c.stage === "Final Selection" || c.stage === "Offer" || c.stage === "Joined"
  ).length;
  const selectionCount = offers.filter((o) => o.status === "Accepted").length;
  const joinedCount = joinings.filter((j) => j.status === "Joined").length;

  const pipelineCandidates = candidates.filter(
    (c) => (c.stage === "Final Selection" || c.stage === "Offer" || c.stage === "Joined") && !PRE_OFFER_LOSE_STATUSES.has(c.finalSelectStatus)
  );
  const production = pipelineCandidates.reduce((sum, c) => sum + c.expectedCtc, 0);

  const joinedIds = new Set(joinings.filter((j) => j.status === "Joined").map((j) => j.candidateId));
  const revenue = offers
    .filter((o) => joinedIds.has(o.candidateId))
    .reduce((sum, o) => sum + o.billValue, 0);

  const recruiter = state.recruiters.find((r) => r.id === recruiterId);
  const achievementPct = (recruiter?.target ?? 0) === 0 ? 0 : Math.round((joinedCount / (recruiter?.target ?? 1)) * 100);

  return { cvCount, l1Interviews, l2Interviews, ciRounds, finalSelectCount, selectionCount, joinedCount, production, revenue, achievementPct };
}

export function getRecruiterProfileDetail(state: DashboardState, selectedMonth: string): RecruiterProfileDetail[] {
  const now = new Date();
  const momTrendMonths: Array<{ month: string; label: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
    momTrendMonths.push({ month: key, label: formatMonthLabel(key) });
  }

  return state.recruiters
    .filter((r) => r.active)
    .map((r) => {
      const month = buildRecruiterPeriodStats(state, r.id, selectedMonth);
      const allTime = buildRecruiterPeriodStats(state, r.id);
      const momTrend = momTrendMonths.map((m) => ({
        month: m.month,
        label: m.label,
        cvCount: state.candidates.filter(
          (c) => c.recruiterId === r.id && monthKey(c.submittedAt) === m.month
        ).length,
      }));
      return { id: r.id, name: r.name, vertical: r.vertical, target: r.target, month, allTime, momTrend };
    })
    .sort((a, b) => b.allTime.cvCount - a.allTime.cvCount);
}

export interface RecruiterExtendedTrends {
  trends: Array<{ month: string; label: string; cvCount: number; interviewCount: number; joinedCount: number }>;
  funnel: Array<{ stage: string; count: number; conversionPct: number }>;
  screenRejects: number;
  feedbackPending: number;
  interviewsDone: number;
  lastJoiningDate: string | null;
  lastFinalSelectDate: string | null;
}

export function getRecruiterExtendedTrends(state: DashboardState, recruiterId: string, monthFilter?: string): RecruiterExtendedTrends {
  const now = new Date();
  const trends: RecruiterExtendedTrends["trends"] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
    const label = formatMonthLabel(key);
    const cvCount = state.candidates.filter((c) => c.recruiterId === recruiterId && monthKey(c.submittedAt) === key).length;
    const interviewCount = state.interviews.filter(
      (i) => i.recruiterId === recruiterId && monthKey(i.interviewDate) === key && activeInterviewStatuses.has(i.status)
    ).length;
    const joinedCount = state.joinings.filter(
      (j) => j.recruiterId === recruiterId && j.status === "Joined" && monthKey(j.joiningDate) === key
    ).length;
    trends.push({ month: key, label, cvCount, interviewCount, joinedCount });
  }

  const interviews = monthFilter
    ? state.interviews.filter((i) => i.recruiterId === recruiterId && monthKey(i.interviewDate) === monthFilter)
    : state.interviews.filter((i) => i.recruiterId === recruiterId);
  const candidates = monthFilter
    ? state.candidates.filter((c) => c.recruiterId === recruiterId && monthKey(c.submittedAt) === monthFilter)
    : state.candidates.filter((c) => c.recruiterId === recruiterId);
  const joinings = monthFilter
    ? state.joinings.filter((j) => j.recruiterId === recruiterId && monthKey(j.joiningDate) === monthFilter)
    : state.joinings.filter((j) => j.recruiterId === recruiterId);

  const l1Count = interviews.filter((i) => i.round === "L1" && activeInterviewStatuses.has(i.status)).length;
  const l2Count = interviews.filter((i) => i.round === "L2" && activeInterviewStatuses.has(i.status)).length;
  const ciCount = interviews.filter((i) => i.round === "CI" && activeInterviewStatuses.has(i.status)).length;
  const joinedCount = joinings.filter((j) => j.status === "Joined").length;

  const stages = [
    { stage: "CVs", count: candidates.length },
    { stage: "L1 Interviews", count: l1Count },
    { stage: "L2 Interviews", count: l2Count },
    { stage: "CI Rounds", count: ciCount },
    { stage: "Joined", count: joinedCount },
  ];
  const funnel: RecruiterExtendedTrends["funnel"] = stages.map((s, i) => ({
    ...s,
    conversionPct: i === 0 ? 100 : stages[i - 1].count === 0 ? 0 : Math.round((s.count / stages[i - 1].count) * 100),
  }));

  const screenRejects = candidates.filter((c) => c.stage === "Rejected").length;
  const feedbackPending = interviews.filter((i) => i.status === "L1 Done" || i.status === "L2 Done" || i.status === "CI Round Done").length;
  const interviewsDone = interviews.filter((i) => i.status.includes("Done")).length;

  const lastJoinings = state.joinings
    .filter((j) => j.recruiterId === recruiterId && j.status === "Joined")
    .sort((a, b) => b.joiningDate.localeCompare(a.joiningDate));
  const lastJoiningDate = lastJoinings.length > 0 ? lastJoinings[0].joiningDate : null;

  const fsCandidates = state.candidates
    .filter((c) => c.recruiterId === recruiterId && c.finalSelectDate && c.finalSelectDate !== "")
    .sort((a, b) => b.finalSelectDate.localeCompare(a.finalSelectDate));
  const lastFinalSelectDate = fsCandidates.length > 0 ? fsCandidates[0].finalSelectDate : null;

  return { trends, funnel, screenRejects, feedbackPending, interviewsDone, lastJoiningDate, lastFinalSelectDate };
}

export function getQuarterKey(date: Date): string {
  const m = date.getMonth() + 1;
  if (m >= 7 && m <= 9) return `FY${date.getFullYear() - 2000}-Q1`;
  if (m >= 10 && m <= 12) return `FY${date.getFullYear() - 2000}-Q2`;
  if (m >= 1 && m <= 3) return `FY${date.getFullYear() - 1 - 2000}-Q3`;
  return `FY${date.getFullYear() - 1 - 2000}-Q4`;
}

export function getQuarterMonths(quarterKey: string): [string, string, string] {
  const [fy, q] = quarterKey.split("-Q");
  const fyStart = Number(fy.replace("FY", "")) + 2000;
  if (q === "1") return [`${fyStart}-07`, `${fyStart}-08`, `${fyStart}-09`];
  if (q === "2") return [`${fyStart}-10`, `${fyStart}-11`, `${fyStart}-12`];
  if (q === "3") return [`${fyStart + 1}-01`, `${fyStart + 1}-02`, `${fyStart + 1}-03`];
  return [`${fyStart + 1}-04`, `${fyStart + 1}-05`, `${fyStart + 1}-06`];
}

export function getQuarterOptions(): Array<{ label: string; value: string }> {
  const options: Array<{ label: string; value: string }> = [];
  const now = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    const key = getQuarterKey(d);
    const [fy] = key.split("-Q");
    const label = `${key.replace(fy, fy.replace("FY", "FY "))}`;
    if (!options.some((o) => o.value === key)) {
      options.push({ label, value: key });
    }
  }
  return options;
}

export function getRevenueQuarterly(state: DashboardState, quarterKey: string): { revenue: number; production: number } {
  const months = getQuarterMonths(quarterKey);
  const monthSet = new Set(months);
  const joined = state.joinings.filter((j) => j.status === "Joined" && monthSet.has(monthKey(j.joiningDate)));
  const joinedIds = new Set(joined.map((j) => j.candidateId));
  const revenue = state.offers.filter((o) => joinedIds.has(o.candidateId)).reduce((s, o) => s + o.billValue, 0);
  const preOfferLoseIds = new Set(state.candidates.filter((c) => PRE_OFFER_LOSE_STATUSES.has(c.finalSelectStatus)).map((c) => c.id));
  const production = state.offers
    .filter((o) => o.offerDate && monthSet.has(monthKey(o.offerDate)) && !preOfferLoseIds.has(o.candidateId))
    .reduce((s, o) => s + o.billValue, 0);
  return { revenue, production };
}

export interface OfferLossMetrics {
  preOfferLose: number;
  preOfferLoseCount: number;
  postOfferLose: number;
  postOfferLoseCount: number;
  totalPipelineValue: number;
  pipelineCount: number;
}

export function getOfferLossMetrics(state: DashboardState, selectedMonth: string): OfferLossMetrics {
  const monthCandidates = state.candidates.filter((c) => monthKey(c.submittedAt) === selectedMonth);
  const preOfferLoseCandidates = monthCandidates.filter(
    (c) => c.stage === "Final Selection" && PRE_OFFER_LOSE_STATUSES.has(c.finalSelectStatus)
  );
  const preOfferLose = preOfferLoseCandidates.reduce((s, c) => s + c.expectedCtc, 0);
  const preOfferLoseCount = preOfferLoseCandidates.length;

  const monthOffers = state.offers.filter((o) => monthKey(o.offerDate) === selectedMonth);
  const postOfferLoseOffers = monthOffers.filter((o) => o.selectionStatus === "Offer Declined");
  const postOfferLose = postOfferLoseOffers.reduce((s, o) => s + o.billValue, 0);
  const postOfferLoseCount = postOfferLoseOffers.length;

  const pendingPipeline = state.offers.filter((o) => o.selectionStatus === "Joining Pending");
  const totalPipelineValue = pendingPipeline.reduce((s, o) => s + o.billValue, 0);
  const pipelineCount = pendingPipeline.length;

  return { preOfferLose, preOfferLoseCount, postOfferLose, postOfferLoseCount, totalPipelineValue, pipelineCount };
}

export interface ClientRevenueRow {
  clientId: string;
  clientName: string;
  joinedCount: number;
  revenue: number;
  pipelineValue: number;
}

export function getClientRevenueBreakdown(state: DashboardState, selectedMonth: string): ClientRevenueRow[] {
  const monthJoinings = state.joinings.filter(
    (j) => j.status === "Joined" && monthKey(j.joiningDate) === selectedMonth
  );
  const joinedIds = new Set(monthJoinings.map((j) => j.candidateId));
  const revenueByClient = new Map<string, { revenue: number; pipeline: number }>();
  state.clients.forEach((c) => revenueByClient.set(c.id, { revenue: 0, pipeline: 0 }));

  state.offers.filter((o) => joinedIds.has(o.candidateId)).forEach((o) => {
    const entry = revenueByClient.get(o.clientId);
    if (entry) entry.revenue += o.billValue;
  });

  const pendingOffers = state.offers.filter((o) => o.selectionStatus === "Joining Pending");
  pendingOffers.forEach((o) => {
    const entry = revenueByClient.get(o.clientId);
    if (entry) entry.pipeline += o.billValue;
  });

  return state.clients
    .map((client) => {
      const d = revenueByClient.get(client.id)!;
      return {
        clientId: client.id,
        clientName: client.name,
        joinedCount: monthJoinings.filter((j) => j.clientId === client.id).length,
        revenue: d.revenue,
        pipelineValue: d.pipeline,
      };
    })
    .filter((r) => r.revenue > 0 || r.pipelineValue > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

export interface ClientAnalyticsRow {
  clientId: string;
  clientName: string;
  industry: string;
  ownerRecruiterName: string;
  totalPositions: number;
  activePositions: number;
  cvCount: number;
  interviewCount: number;
  finalSelectionCount: number;
  offerCount: number;
  joinedCount: number;
  revenue: number;
}

export function getClientAnalytics(state: DashboardState, filters: DashboardFilters, selectedMonth?: string | "all"): ClientAnalyticsRow[] {
  const lookups = createLookups(state);
  const isAll = selectedMonth === "all" || !selectedMonth;

  return state.clients.map((client) => {
    const clientPositions = state.positions.filter((p) => p.clientId === client.id);
    const clientCandidates = state.candidates.filter((c) => c.clientId === client.id);
    const clientInterviews = state.interviews.filter((i) => i.clientId === client.id);
    const clientOffers = state.offers.filter((o) => o.clientId === client.id);

    const cvShared = isAll
      ? state.cvSharedEntries.filter((e) => e.clientId === client.id).reduce((s, e) => s + e.count, 0)
      : state.cvSharedEntries.filter((e) => e.clientId === client.id && e.month === selectedMonth).reduce((s, e) => s + e.count, 0);

    const monthCandidates = isAll ? clientCandidates : clientCandidates.filter((c) => monthKey(c.submittedAt) === selectedMonth);
    const monthInterviews = isAll ? clientInterviews : clientInterviews.filter((i) => monthKey(i.interviewDate) === selectedMonth);
    const monthOffers = isAll ? clientOffers : clientOffers.filter((o) => monthKey(o.offerDate) === selectedMonth);
    const monthJoinings = state.joinings.filter((j) => {
      if (j.clientId !== client.id) return false;
      if (j.status !== "Joined") return false;
      return isAll || monthKey(j.joiningDate) === selectedMonth;
    });
    const joinedIds = new Set(monthJoinings.map((j) => j.candidateId));
    const revenue = monthOffers.filter((o) => joinedIds.has(o.candidateId)).reduce((sum, o) => sum + o.billValue, 0);

    return {
      clientId: client.id,
      clientName: client.name,
      industry: client.industry,
      ownerRecruiterName: lookups.recruiters.get(client.ownerRecruiterId)?.name ?? "—",
      totalPositions: clientPositions.length,
      activePositions: clientPositions.filter((p) => p.status !== "Closed").length,
      cvCount: cvShared,
      interviewCount: monthInterviews.length,
      finalSelectionCount: monthCandidates.filter((c) => c.stage === "Final Selection" || c.stage === "Offer").length,
      offerCount: monthOffers.length,
      joinedCount: monthJoinings.length,
      revenue,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

export interface PocBreakdownRow {
  spocName: string;
  positionCount: number;
  candidateCount: number;
  interviewCount: number;
  finalSelectionCount: number;
  offerCount: number;
  joinedCount: number;
}

export function getClientPocBreakdown(state: DashboardState, clientId: string): PocBreakdownRow[] {
  const lookups = createLookups(state);
  const clientSpocs = state.spocs.filter((s) => s.clientId === clientId);
  return clientSpocs.map((spoc) => {
    const spocPositions = state.positions.filter((p) => p.spocId === spoc.id);
    const spocPositionIds = new Set(spocPositions.map((p) => p.id));
    const spocCandidates = state.candidates.filter((c) => spocPositionIds.has(c.positionId));
    const spocCandidateIds = new Set(spocCandidates.map((c) => c.id));
    return {
      spocName: spoc.name,
      positionCount: spocPositions.length,
      candidateCount: spocCandidates.length,
      interviewCount: state.interviews.filter((i) => spocCandidateIds.has(i.candidateId)).length,
      finalSelectionCount: spocCandidates.filter((c) => c.stage === "Final Selection" || c.stage === "Offer").length,
      offerCount: state.offers.filter((o) => spocCandidateIds.has(o.candidateId)).length,
      joinedCount: state.joinings.filter((j) => j.status === "Joined" && spocCandidateIds.has(j.candidateId)).length,
    };
  });
}

export function getDataMonths(state: DashboardState): string[] {
  const months = new Set<string>();
  state.candidates.forEach((c) => { if (c.submittedAt) months.add(monthKey(c.submittedAt)); });
  state.offers.forEach((o) => { if (o.offerDate) months.add(monthKey(o.offerDate)); });
  state.joinings.forEach((j) => { if (j.joiningDate) months.add(monthKey(j.joiningDate)); });
  state.interviews.forEach((i) => { if (i.interviewDate) months.add(monthKey(i.interviewDate)); });
  return [...months].sort().reverse();
}
