"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Trash2, X, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { StepFormModal } from "@/components/ui/step-form-modal";
import { DetailModalShell, DetailSectionCard, DetailSectionTitle, DetailSectionRow } from "@/components/ui/detail-modal-shell";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  SectionPageLayout,
  SectionTable,
  SectionRow,
  SectionEmpty,
} from "@/components/dashboard/section-layout";
import { useApp } from "@/components/providers/app-provider";
import { createLookups, getDataMonths } from "@/lib/data/selectors";
import {
  DEFAULT_STATUS_BY_ROUND,
  getRoundEligibleCandidates,
} from "@/lib/data/interview-candidates";
import type { Candidate, Interview, InterviewStatus } from "@/lib/data/types";
import { formatLongDate, formatMonthLabel, monthKey } from "@/lib/utils";
import { SectionDownload } from "@/components/dashboard/section-download";

import { FilterSelect } from "@/components/ui/filter-select";
const CANCELLABLE_STATUSES = new Set(["Cancelled", "No Show", "Panel No Show"]);

const ALL_STATUSES: InterviewStatus[] = [
  "L1 Scheduled", "L1 Done", "L1 Select", "L1 Reject",
  "L2 Scheduled", "L2 Done", "L2 Select", "L2 Reject",
  "CI Round Scheduled", "CI Round Done", "CI Reject",
  "Final Select", "No Show", "Panel No Show", "Cancelled",
];

const COMPLETED_STATUSES = new Set<InterviewStatus>([
  "L1 Done", "L1 Select", "L1 Reject", "L2 Done", "L2 Select", "L2 Reject",
  "CI Round Done", "CI Reject", "Final Select", "No Show", "Panel No Show", "Cancelled",
]);

const ROUNDS = ["L1", "L2", "CI"] as const;

const ROUND_LABELS: Record<string, string> = {
  L1: "L1 Round",
  L2: "L2 Round",
  CI: "Client Round",
};

const NEXT_ROUND: Record<string, string> = {
  L1: "L2",
  L2: "CI",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function statusesForRound(round: string): InterviewStatus[] {
  const roundStatuses: Record<string, InterviewStatus[]> = {
    L1: ["L1 Scheduled", "L1 Done", "L1 Select", "L1 Reject"],
    L2: ["L2 Scheduled", "L2 Done", "L2 Select", "L2 Reject"],
    CI: ["CI Round Scheduled", "CI Round Done", "CI Reject"],
  };
  const generalStatuses: InterviewStatus[] = ["Final Select", "No Show", "Panel No Show", "Cancelled"];
  return [...(roundStatuses[round] ?? []), ...generalStatuses];
}

function PositionSelect({ value, onChange, state }: { value: string; onChange: (v: string) => void; state: any }) {
  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white";
  return (
    <select className={`mt-1.5 ${ic}`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select position</option>
      {state.positions.filter((p: any) => p.status === "Open").map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

function CandidateSelect({ value, onChange, candidates }: { value: string; onChange: (v: string) => void; candidates: Candidate[] }) {
  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white";
  return (
    <select className={`mt-1.5 ${ic}`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select candidate</option>
      {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}

function NotesInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white";
  return (
    <textarea className={`mt-1.5 ${ic} resize-none`} rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Add notes..." />
  );
}

function ExistingRounds({ interviews, candidateId, round }: { interviews: Interview[]; candidateId: string; round: string }) {
  const priorRound = round === "L2" ? "L1" : round === "CI" ? "L2" : null;
  if (!priorRound) return null;
  const priorInterviews = interviews.filter((i) => i.candidateId === candidateId && i.round === priorRound);
  if (priorInterviews.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <DetailSectionTitle>Previous Round ({priorRound})</DetailSectionTitle>
      <div className="space-y-2 text-sm">
        {priorInterviews.map((i) => (
          <div key={i.id} className="flex items-center justify-between">
            <span className="text-slate-500">{formatLongDate(i.interviewDate)}</span>
            <StatusPill status={i.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewPipeline({ interviews, candidateId }: { interviews: Interview[]; candidateId: string }) {
  const candidateInterviews = interviews.filter((i) => i.candidateId === candidateId);
  if (candidateInterviews.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <DetailSectionTitle>Interview Pipeline</DetailSectionTitle>
      <div className="space-y-2">
        {candidateInterviews.sort((a, b) => a.interviewDate.localeCompare(b.interviewDate)).map((i) => (
          <div key={i.id} className="flex items-center gap-3 py-1.5">
            <div className={`h-2 w-2 shrink-0 rounded-full ${
              i.status === "Cancelled" || i.status === "No Show" || i.status === "Panel No Show"
                ? "bg-red-400"
                : i.status.includes("Select") || i.status === "Final Select"
                ? "bg-emerald-500"
                : "bg-amber-400"
            }`} />
            <span className="w-8 text-xs font-medium text-slate-600">{i.round}</span>
            <span className="text-xs text-slate-500">{formatLongDate(i.interviewDate)}</span>
            <StatusPill status={i.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewFormModal({
  onClose,
  prefill,
  onSave,
}: {
  onClose: () => void;
  prefill?: Partial<Omit<Interview, "id">>;
  onSave?: (data: any, existingId?: string) => void;
}) {
  const { state, addInterview, currentRecruiterId } = useApp();
  const lookups = useMemo(() => createLookups(state), [state]);
  const isEditing = !!prefill?.interviewDate;
  const [step, setStep] = useState(1);
  const [candidateId, setCandidateId] = useState(prefill?.candidateId ?? "");
  const [positionId, setPositionId] = useState(prefill?.positionId ?? "");
  const [round, setRound] = useState(prefill?.round ?? "L1");
  const [interviewDate, setInterviewDate] = useState(prefill?.interviewDate ?? today());
  const [time, setTime] = useState(prefill?.time ?? "");
  const [status, setStatus] = useState<InterviewStatus>(prefill?.status ?? DEFAULT_STATUS_BY_ROUND["L1"]);
  const [feedbackDue, setFeedbackDue] = useState(prefill?.feedbackDue ?? "");
  const [remarks, setRemarks] = useState(prefill?.remarks ?? "");

  const eligibleCandidates = useMemo(() => {
    return getRoundEligibleCandidates(state.candidates, state.interviews, positionId, round, currentRecruiterId ?? "");
  }, [state.candidates, state.interviews, positionId, round, currentRecruiterId]);

  const selectedCandidate = candidateId ? lookups.candidates.get(candidateId) : undefined;
  const selectedPosition = positionId ? lookups.positions.get(positionId) : undefined;

  const canNext = step === 1 ? !!(candidateId && positionId) : step === 2 ? !!(interviewDate && time) : true;
  const isValid = !!candidateId && !!positionId && !!interviewDate && !!time && !!round && !!status;

  const handleSubmit = () => {
    if (!isValid || !currentRecruiterId || !selectedPosition) return;
    const data = {
      candidateId,
      positionId,
      clientId: selectedPosition.clientId,
      recruiterId: currentRecruiterId,
      interviewDate,
      time,
      round,
      status,
      feedbackDue,
      remarks,
    };
    if (onSave) {
      onSave(data, prefill ? (prefill as any).id : undefined);
    } else if (!prefill) {
      addInterview(data);
      toast.success(`Interview scheduled for ${selectedCandidate?.name ?? "candidate"}.`);
    }
    onClose();
  };

  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white";
  const lc = "text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <StepFormModal
      open={true}
      onClose={onClose}
      title="Schedule Interview"
      accent="amber"
      size="xl"
      steps={["Position & Candidate", "Schedule Details", "Review"]}
      currentStep={step}
      onStepChange={setStep}
      canNext={canNext}
      isValid={!!isValid}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitLabel="Schedule"
    >
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className={lc}>Position *</label>
            <PositionSelect value={positionId} onChange={(v) => { setPositionId(v); setCandidateId(""); }} state={state} />
          </div>
          <div>
            <label className={lc}>Candidate *</label>
            <CandidateSelect value={candidateId} onChange={setCandidateId} candidates={eligibleCandidates} />
            {selectedCandidate && (
              <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {selectedCandidate.name} · {selectedCandidate.contactNo} · {selectedCandidate.emailId}
              </div>
            )}
          </div>
          <div>
            <label className={lc}>Round *</label>
            <select
              className={`mt-1.5 ${ic}`}
              value={round}
              onChange={(e) => {
                const nextRound = e.target.value;
                setRound(nextRound);
                if (!prefill) {
                  setStatus(DEFAULT_STATUS_BY_ROUND[nextRound as keyof typeof DEFAULT_STATUS_BY_ROUND]);
                }
              }}
            >
              {ROUNDS.map((r: string) => <option key={r} value={r}>{ROUND_LABELS[r]}</option>)}
            </select>
          </div>
          {positionId && candidateId && <ExistingRounds interviews={state.interviews} candidateId={candidateId} round={round} />}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lc}>Interview Date *</label>
              <input type="date" className={`mt-1.5 ${ic}`} value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
            </div>
            <div>
              <label className={lc}>Time *</label>
              <input type="time" className={`mt-1.5 ${ic}`} value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lc}>Status *</label>
            <select className={`mt-1.5 ${ic}`} value={status} onChange={(e) => setStatus(e.target.value as InterviewStatus)}>
              {statusesForRound(round).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lc}>Feedback Due Date</label>
            <input type="date" className={`mt-1.5 ${ic}`} value={feedbackDue} onChange={(e) => setFeedbackDue(e.target.value)} />
          </div>
          <div>
            <label className={lc}>Remarks</label>
            <NotesInput value={remarks} onChange={setRemarks} />
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-100/80 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Check className="h-3 w-3" /> Summary
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              {[["Position", selectedPosition?.name ?? "—"],["Candidate", selectedCandidate?.name ?? "—"],["Round", ROUND_LABELS[round]],["Date", interviewDate],["Time", time || "—"],["Status", status],["Feedback Due", feedbackDue || "—"],["Remarks", remarks || "—"]].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-500">{l}</span><span className="font-medium text-slate-800">{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </StepFormModal>
  );
}

function DetailModal({
  interview,
  allCandidateInterviews,
  onClose,
  onDelete,
  onScheduleNext,
}: {
  interview: Interview;
  allCandidateInterviews: Interview[];
  onClose: () => void;
  onDelete?: () => void;
  onScheduleNext?: (interview: Interview) => void;
}) {
  const { state, updateInterviewAll, currentRecruiterId } = useApp();
  const lookups = useMemo(() => createLookups(state), [state]);
  const isOwner = interview.recruiterId === currentRecruiterId;
  const isAdmin = state.currentUserRole === "admin";
  const canEdit = isOwner || isAdmin;

  const candidate = lookups.candidates.get(interview.candidateId);
  const position = lookups.positions.get(interview.positionId);
  const client = lookups.clients.get(interview.clientId);
  const recruiter = lookups.recruiters.get(interview.recruiterId);

  const [positionId, setPositionId] = useState(interview.positionId);
  const [round, setRound] = useState(interview.round);
  const [interviewDate, setInterviewDate] = useState(interview.interviewDate);
  const [time, setTime] = useState(interview.time);
  const [status, setStatus] = useState<InterviewStatus>(interview.status);
  const [feedbackDue, setFeedbackDue] = useState(interview.feedbackDue);
  const [remarks, setRemarks] = useState(interview.remarks);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const candidateName = candidate?.name ?? "Unknown";
  const initials = candidateName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const selectedPosition = positionId ? lookups.positions.get(positionId) : undefined;

  const hasChanges =
    positionId !== interview.positionId ||
    round !== interview.round ||
    interviewDate !== interview.interviewDate ||
    time !== interview.time ||
    status !== interview.status ||
    feedbackDue !== interview.feedbackDue ||
    remarks !== interview.remarks;

  const handleSave = () => {
    if (!canEdit || !selectedPosition) return;
    setSaving(true);
    updateInterviewAll({
      interviewId: interview.id,
      interview: {
        ...interview,
        positionId,
        clientId: selectedPosition.clientId,
        interviewDate,
        time,
        round,
        status,
        feedbackDue,
        remarks,
      },
    });
    toast.success("Interview updated.");
    setTimeout(() => setSaving(false), 300);
  };

  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white";
  const lc = "text-xs font-semibold uppercase tracking-wider text-slate-500";

  const canScheduleNext = !!NEXT_ROUND[interview.round] && interview.status === (`${interview.round} Select` as InterviewStatus);
  const nextRound = NEXT_ROUND[interview.round];

  const subtitle = `${position?.name ?? ""}${client ? ` · ${client.name}` : ""} · ${ROUND_LABELS[interview.round]}`;

  return (
    <DetailModalShell
      open={true}
      onClose={onClose}
      accent="amber"
      initials={initials}
      title={candidateName}
      subtitle={subtitle}
      statusBadge={<StatusPill status={interview.status} />}
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing(!isEditing)}
      canEdit={canEdit}
      footer={
        isEditing ? (
          <>
            {isAdmin && onDelete && (
              <Button variant="destructive" size="sm" className="mr-auto gap-1.5" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </>
        ) : (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              {canScheduleNext && onScheduleNext && (
                <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" onClick={() => onScheduleNext(interview)}>
                  Schedule {nextRound} <span className="text-sm">&rarr;</span>
                </Button>
              )}
              {CANCELLABLE_STATUSES.has(interview.status) && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setStatus(DEFAULT_STATUS_BY_ROUND[interview.round] ?? "L1 Scheduled"); setIsEditing(true); }}>
                  &crarr; Reschedule
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        )
      }
    >
      {!isEditing ? (
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-4">
            <DetailSectionCard>
              <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-amber-400" /> Schedule</DetailSectionTitle>
              <div className="space-y-2.5 text-sm">
                <DetailSectionRow label="Date" value={formatLongDate(interview.interviewDate)} />
                <DetailSectionRow label="Time" value={interview.time || "—"} />
                <DetailSectionRow label="Round" value={ROUND_LABELS[interview.round]} />
              </div>
            </DetailSectionCard>
            <DetailSectionCard>
              <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-amber-400" /> Points of Contact</DetailSectionTitle>
              <div className="space-y-2.5 text-sm">
                <DetailSectionRow label="Candidate Contact" value={candidate?.contactNo ?? "—"} />
                <DetailSectionRow label="Client POC" value="—" />
                <DetailSectionRow label="Recruiter" value={recruiter?.name ?? "—"} />
              </div>
            </DetailSectionCard>
          </div>
          <div className="space-y-4">
            <DetailSectionCard>
              <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-amber-400" /> Pipeline</DetailSectionTitle>
              <InterviewPipeline interviews={allCandidateInterviews} candidateId={interview.candidateId} />
            </DetailSectionCard>
            <DetailSectionCard>
              <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-amber-400" /> Notes</DetailSectionTitle>
              <p className="text-sm leading-relaxed text-slate-700">{interview.remarks || "No notes"}</p>
            </DetailSectionCard>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <DetailSectionCard>
            <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-amber-400" /> Schedule</DetailSectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className={lc}>Date</div>
                <input type="date" className={`mt-1 ${ic}`} value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
              </div>
              <div>
                <div className={lc}>Time</div>
                <input type="text" className={`mt-1 ${ic}`} value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00 AM" />
              </div>
              <div>
                <div className={lc}>Round</div>
                <div className="mt-1 text-sm leading-relaxed font-semibold text-slate-800">{interview.round}</div>
              </div>
            </div>
          </DetailSectionCard>
          <DetailSectionCard>
            <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-amber-400" /> Status &amp; Notes</DetailSectionTitle>
            <div className="space-y-3">
              <div>
                <div className={lc}>Status</div>
                <select className={`mt-1 ${ic}`} value={status} onChange={(e) => setStatus(e.target.value as InterviewStatus)}>
                  {statusesForRound(round).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className={lc}>Notes</div>
                <textarea className={`mt-1 ${ic} resize-none`} rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add notes..." />
              </div>
            </div>
          </DetailSectionCard>
        </div>
      )}
    </DetailModalShell>
  );
}

export default function InterviewsPage() {
  const { state, addInterview, updateInterviewAll, updateInterviewStatus, deleteInterview, currentRecruiterId, can } = useApp();
  const lookups = useMemo(() => createLookups(state), [state]);
  const [tab, setTab] = useState<"my" | "all">("my");
  const [subTab, setSubTab] = useState<"today" | "upcoming" | "completed">("today");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addPrefill, setAddPrefill] = useState<Partial<Omit<Interview, "id">> | undefined>(undefined);
  const [detailTarget, setDetailTarget] = useState<Interview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Interview | null>(null);
  const [clientFilter, setClientFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState(() => monthKey(new Date()));
  const [quickActionTarget, setQuickActionTarget] = useState<{ interview: Interview; status: InterviewStatus } | null>(null);
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const currentMonthLabel = useMemo(() => formatMonthLabel(monthFilter), [monthFilter]);
  const monthOptions = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);

  const filtered = useMemo(() => {
    if (!state) return [];
    let list = [...state.interviews];

    if (tab === "my" && currentRecruiterId) {
      list = list.filter((i) => i.recruiterId === currentRecruiterId);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      list = list.filter((i) => !COMPLETED_STATUSES.has(i.status) || i.interviewDate >= weekAgo.toISOString().slice(0, 10));
      list = list.filter((i) => monthKey(i.interviewDate) === monthFilter);
    }

    const d = today();
    if (subTab === "today") list = list.filter((i) => i.interviewDate === d);
    else if (subTab === "upcoming") list = list.filter((i) => i.interviewDate > d && !COMPLETED_STATUSES.has(i.status));
    else if (subTab === "completed") list = list.filter((i) => COMPLETED_STATUSES.has(i.status));

    if (clientFilter) list = list.filter((i) => i.clientId === clientFilter);
    if (tab === "all" && recruiterFilter) list = list.filter((i) => i.recruiterId === recruiterFilter);
    if (statusFilter) list = list.filter((i) => i.status === statusFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((i) => {
        const c = lookups.candidates.get(i.candidateId);
        const p = lookups.positions.get(i.positionId);
        const cl = lookups.clients.get(i.clientId);
        const r = lookups.recruiters.get(i.recruiterId);
        return [c?.name, p?.name, cl?.name, r?.name, i.round, i.status, i.time, i.interviewDate].some(
          (v) => `${v ?? ""}`.toLowerCase().includes(q)
        );
      });
    }

    list.sort((a, b) => a.interviewDate.localeCompare(b.interviewDate) || a.time.localeCompare(b.time));
    return list;
  }, [state, tab, subTab, clientFilter, recruiterFilter, statusFilter, searchQuery, lookups, currentRecruiterId, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedList = useMemo(() => {
    return filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  }, [filtered, safePage]);

  const candidateInterviews = useMemo(() =>
    detailTarget
      ? state.interviews.filter((i) => i.candidateId === detailTarget.candidateId).sort((a, b) => a.interviewDate.localeCompare(b.interviewDate))
      : [],
    [state.interviews, detailTarget]
  );

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [tab, subTab, clientFilter, recruiterFilter, statusFilter, searchQuery, monthFilter]);

  const downloadable = useMemo(() => {
    if (!filtered.length) return [];
    return filtered.map((item) => {
      const candidate = lookups.candidates.get(item.candidateId);
      const position = lookups.positions.get(item.positionId);
      const client = lookups.clients.get(item.clientId);
      const recruiter = lookups.recruiters.get(item.recruiterId);

      return {
        interviewDate: item.interviewDate,
        time: item.time,
        candidateName: candidate?.name,
        positionName: position?.name,
        clientName: client?.name,
        recruiterName: recruiter?.name,
        round: item.round,
        status: item.status,
      };
    });
  }, [filtered, lookups]);

  const canEdit = can("edit_status");

  const DENSE_STATUS_TRANSITIONS: Partial<Record<InterviewStatus, InterviewStatus[]>> = {
    "L1 Scheduled": ["L1 Done", "No Show", "Panel No Show", "Cancelled", "Final Select"],
    "L1 Done": ["L1 Scheduled", "L1 Select", "L1 Reject", "Final Select"],
    "L1 Select": ["L1 Done", "Final Select"],
    "L2 Scheduled": ["L2 Done", "No Show", "Panel No Show", "Cancelled", "Final Select"],
    "L2 Done": ["L2 Scheduled", "L2 Select", "L2 Reject", "Final Select"],
    "L2 Select": ["L2 Done", "Final Select"],
    "CI Round Scheduled": ["CI Round Done", "No Show", "Panel No Show", "Cancelled", "Final Select"],
    "CI Round Done": ["CI Round Scheduled", "CI Reject", "Final Select"],
  };

  const handleQuickAction = (interview: Interview, newStatus: InterviewStatus) => {
    updateInterviewStatus({ interviewId: interview.id, status: newStatus, remarks: interview.remarks });
    setQuickActionTarget(null);
  };

  const handleScheduleNext = (interview: Interview) => {
    const next = NEXT_ROUND[interview.round];
    if (!next) return;
    setDetailTarget(null);
    setAddPrefill({
      candidateId: interview.candidateId,
      positionId: interview.positionId,
      clientId: interview.clientId,
      recruiterId: interview.recruiterId,
      round: next,
      status: DEFAULT_STATUS_BY_ROUND[next] as InterviewStatus,
    });
    setAddModalOpen(true);
  };

  const handleAddModalClose = () => {
    setAddModalOpen(false);
    setAddPrefill(undefined);
  };

  if (!state) return null;

  return (
    <SectionPageLayout
      title="Interview"
      accent="amber"
      tabs={[
        { label: "My Interviews", value: "my" },
        { label: "All Interviews", value: "all" },
      ]}
      activeTab={tab}
      onTabChange={(v) => setTab(v as "my" | "all")}
      filters={
        <>
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            {([
              { label: "Today", value: "today" as const },
              { label: "Upcoming", value: "upcoming" as const },
              { label: "Completed", value: "completed" as const },
            ]).map((t) => (
              <button
                key={t.value}
                onClick={() => setSubTab(t.value)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  subTab === t.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              className="w-44 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white placeholder:text-slate-400"
              placeholder="Search interviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {tab === "my" && (
            <FilterSelect accent="amber" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </FilterSelect>
          )}
          <FilterSelect accent="amber" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          {tab === "all" && (
            <FilterSelect accent="amber" value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)}>
              <option value="">All Recruiters</option>
              {state.recruiters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </FilterSelect>
          )}
          <FilterSelect accent="amber" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>
        </>
      }
      action={
        <div className="flex gap-2">
          {state.currentUserRole !== "recruiter" && (
            <SectionDownload
              data={downloadable}
              filename={`interviews-${tab}-${subTab}-${formatLongDate(new Date().toISOString())}.xlsx`}
              sheetName="Interviews"
              columns={[
                { header: "Date", accessor: "interviewDate", width: 12 },
                { header: "Time", accessor: "time", width: 8 },
                { header: "Candidate", accessor: "candidateName", width: 20 },
                { header: "Position", accessor: "positionName", width: 20 },
                { header: "Client", accessor: "clientName", width: 15 },
                { header: "Recruiter", accessor: "recruiterName", width: 15 },
                { header: "Round", accessor: "round", width: 8 },
                { header: "Status", accessor: "status", width: 12 },
              ]}
              filters={{
                clientFilter,
                recruiterFilter: tab === "all" ? recruiterFilter : undefined,
                statusFilter,
                dateRange: { fromDate: "", toDate: "" },
              }}
              compact={true}
            />
          )}
          <Button size="sm" className="gap-1.5" onClick={() => { setAddPrefill(undefined); setAddModalOpen(true); }} disabled={!can("edit_status")}>
            <Plus className="h-4 w-4" /> Add Interview
          </Button>
        </div>
      }
      count={filtered.length}
      countLabel={tab === "my" ? `interviews in ${currentMonthLabel}` : `interviews (page ${safePage + 1} of ${totalPages})`}
    >
      <SectionTable
        headers={[
          { label: "Date" },
          { label: "Time" },
          { label: "Candidate" },
          { label: "Position" },
          { label: "Client" },
          { label: "Recruiter" },
          { label: "Status" },
          { label: "Actions", className: "w-20 text-center" },
        ]}
        accent="amber"
      >
        {pagedList.map((interview) => {
          const candidate = lookups.candidates.get(interview.candidateId);
          const position = lookups.positions.get(interview.positionId);
          const client = lookups.clients.get(interview.clientId);
          const recruiter = lookups.recruiters.get(interview.recruiterId);
          const isOwn = interview.recruiterId === currentRecruiterId;
          const transitions = DENSE_STATUS_TRANSITIONS[interview.status];
          const hasActions = (isOwn || canEdit) && transitions && transitions.length > 0;

          return (
            <SectionRow key={interview.id} accent="amber">
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatLongDate(interview.interviewDate)}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-600 whitespace-nowrap">{interview.time}</td>
              <td className="border-b border-slate-100 px-4 py-3.5">
                <button className="text-left font-medium text-amber-600 hover:text-amber-800 hover:underline transition-colors" onClick={() => setDetailTarget(interview)}>
                  {candidate?.name ?? "—"}
                </button>
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5">
                <button className="text-left font-medium text-amber-600 hover:text-amber-800 hover:underline transition-colors" onClick={() => setDetailTarget(interview)}>
                  {position?.name ?? "—"}
                </button>
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{client?.name ?? "—"}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">
                {recruiter?.name ?? "—"}
                {isOwn && <span className="ml-1.5 text-xs text-amber-500 font-medium">(You)</span>}
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  <StatusPill status={interview.status} />
                  {CANCELLABLE_STATUSES.has(interview.status) && (
                    <button className="rounded-md border border-slate-200 px-1.5 py-1 text-[11px] font-medium text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-colors" title="Reschedule interview" onClick={() => setDetailTarget(interview)}>
                      &crarr;
                    </button>
                  )}
                </div>
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                {hasActions && (
                  <div className="relative inline-block">
                    <button
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setOpenActionsFor(openActionsFor === interview.id ? null : interview.id); }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {openActionsFor === interview.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenActionsFor(null)} />
                        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mark as</div>
                          {transitions.map((s) => (
                            <button
                              key={s}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              onClick={(e) => { e.stopPropagation(); setOpenActionsFor(null); setQuickActionTarget({ interview, status: s as InterviewStatus }); }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </td>
            </SectionRow>
          );
        })}
        {pagedList.length === 0 && <SectionEmpty colSpan={8} message="No interviews found" />}
      </SectionTable>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <span className="text-xs text-slate-400">Page {safePage + 1} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {quickActionTarget && (
        <ModalShell
          open={true}
          onClose={() => setQuickActionTarget(null)}
          title="Confirm Status Change"
          accent="amber"
          size="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setQuickActionTarget(null)}>Cancel</Button>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => handleQuickAction(quickActionTarget.interview, quickActionTarget.status)}>Confirm</Button>
            </>
          }
        >
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                Mark <strong className="text-slate-900">{lookups.candidates.get(quickActionTarget.interview.candidateId)?.name ?? "this interview"}</strong> as <strong className="text-slate-900">{quickActionTarget.status}</strong>?
              </p>
            </div>
          </div>
        </ModalShell>
      )}

      {addModalOpen && (
        <InterviewFormModal
          key={addPrefill ? "prefill" : "blank"}
          onClose={handleAddModalClose}
          prefill={addPrefill}
          onSave={(data: any, existingId?: string) => {
            if (existingId) {
              const existing = state.interviews.find((i) => i.id === existingId);
              if (existing) updateInterviewAll({ interviewId: existingId, interview: { ...existing, ...data } });
            } else {
              addInterview(data);
            }
          }}
        />
      )}

      {detailTarget && (
        <DetailModal
          key={detailTarget.id}
          interview={detailTarget}
          allCandidateInterviews={candidateInterviews}
          onClose={() => setDetailTarget(null)}
          onDelete={() => { setDeleteTarget(detailTarget); setDetailTarget(null); }}
          onScheduleNext={(interview: Interview) => handleScheduleNext(interview)}
        />
      )}

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget ? (lookups.candidates.get(deleteTarget.candidateId)?.name ?? "this interview") : ""}
        onConfirm={() => { if (deleteTarget) { deleteInterview(deleteTarget.id); setDeleteTarget(null); } }}
        itemType="interview"
      />
    </SectionPageLayout>
  );
}
