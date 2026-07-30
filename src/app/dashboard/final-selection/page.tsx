"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Gift, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ModalShell } from "@/components/ui/modal-shell";
import { DetailModalShell, DetailSectionCard, DetailSectionTitle, DetailSectionRow } from "@/components/ui/detail-modal-shell";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import {
  SectionPageLayout,
  SectionTable,
  SectionRow,
  SectionEmpty,
} from "@/components/dashboard/section-layout";
import { useApp } from "@/components/providers/app-provider";
import { getFinalSelectionCandidates, createLookups, getDataMonths } from "@/lib/data/selectors";
import type { FinalSelectStatus } from "@/lib/data/types";
import { formatLongDate, formatMonthLabel, monthKey } from "@/lib/utils";

import { FilterSelect } from "@/components/ui/filter-select";
const STATUS_OPTIONS: FinalSelectStatus[] = [
  "Document Pending",
  "Document Shared",
  "CTC Discussion",
  "Pre Offer Lose",
  "Offer Released",
  "Client Round Pending",
  "Client Reject",
  "Drop",
  "BGV Reject",
];

const PRE_OFFER_LOSE_SET = new Set(["Pre Offer Lose", "Client Reject", "Drop", "BGV Reject"]);

function OfferReleaseModal({
  candidate,
  onClose,
}: {
  candidate: NonNullable<ReturnType<ReturnType<typeof createLookups>["candidates"]["get"]>>;
  onClose: () => void;
}) {
  const { updateFinalSelect } = useApp();
  const [billValue, setBillValue] = useState("");
  const [offeredCtc, setOfferedCtc] = useState(String(candidate.expectedCtc || ""));
  const [joiningDate, setJoiningDate] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = billValue && offeredCtc && joiningDate && !saving;

  const handleConfirm = () => {
    if (!canSave) return;
    setSaving(true);
    updateFinalSelect({
      candidateId: candidate.id,
      currentCtc: candidate.currentCtc,
      expectedCtc: candidate.expectedCtc,
      noticePeriod: candidate.noticePeriod,
      finalSelectDate: candidate.finalSelectDate || new Date().toISOString().split("T")[0],
      finalSelectStatus: "Offer Released",
      remarks: candidate.remarks,
      holdingOfferCtc: candidate.holdingOfferCtc,
      holdingOfferCompany: candidate.holdingOfferCompany,
      holdingOfferDoj: candidate.holdingOfferDoj,
      billValue: Number(billValue) || 0,
      offeredCtc: Number(offeredCtc) || 0,
      joiningDate,
    });
    onClose();
  };

  return (
    <ModalShell open={true} onClose={onClose} title="Release Offer" accent="emerald" size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleConfirm} disabled={!canSave || saving}>
            {saving ? "Releasing..." : "Confirm & Release Offer"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white text-center shadow-md">
          <Gift className="mx-auto mb-2 h-8 w-8 text-emerald-100" />
          <p className="text-lg font-bold">{candidate.name}</p>
          <p className="text-sm text-emerald-100">Releasing offer — fill the details below</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bill Value <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min={0} step={0.5}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
              value={billValue} onChange={(e) => setBillValue(e.target.value)}
              placeholder="Enter bill value in Lacs"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Offered CTC by Client <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min={0} step={0.5}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
              value={offeredCtc} onChange={(e) => setOfferedCtc(e.target.value)}
              placeholder="Enter offered CTC in Lacs"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Joining Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
              value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function DetailModal({
  candidate,
  onClose,
  onDelete,
}: {
  candidate: NonNullable<ReturnType<ReturnType<typeof createLookups>["candidates"]["get"]>>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const { state, updateFinalSelect } = useApp();
  const canEdit = state.currentUserRole === "admin" || state.currentUserRole === "manager";
  const lookups = useMemo(() => createLookups(state), [state]);
  const position = lookups.positions.get(candidate.positionId);
  const client = lookups.clients.get(candidate.clientId);
  const recruiter = lookups.recruiters.get(candidate.recruiterId);
  const spoc = lookups.spocs.get(candidate.spocId);
  const initials = candidate.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const [now] = useState(Date.now);

  const [finalSelectDate, setFinalSelectDate] = useState(candidate.finalSelectDate);
  const [currentCtc, setCurrentCtc] = useState(String(candidate.currentCtc || ""));
  const [expectedCtc, setExpectedCtc] = useState(String(candidate.expectedCtc || ""));
  const [noticePeriod, setNoticePeriod] = useState(candidate.noticePeriod);
  const [finalSelectStatus, setFinalSelectStatus] = useState<FinalSelectStatus>(candidate.finalSelectStatus);
  const [remarks, setRemarks] = useState(candidate.remarks);
  const [hasHoldingOffer, setHasHoldingOffer] = useState(candidate.holdingOfferCtc > 0);
  const [holdingOfferCtc, setHoldingOfferCtc] = useState(String(candidate.holdingOfferCtc || ""));
  const [holdingOfferCompany, setHoldingOfferCompany] = useState(candidate.holdingOfferCompany ?? "");
  const [holdingOfferDoj, setHoldingOfferDoj] = useState(candidate.holdingOfferDoj ?? "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingOfferRelease, setPendingOfferRelease] = useState(false);

  const waitingDays = Math.max(0, (() => {
    const refDate = candidate.finalSelectDate || candidate.submittedAt;
    return Math.floor((now - new Date(refDate).getTime()) / 86400000);
  })());

  const handleSave = () => {
    if (finalSelectStatus === "Offer Released") {
      setPendingOfferRelease(true);
      return;
    }
    setSaving(true);
    updateFinalSelect({
      candidateId: candidate.id,
      currentCtc: Number(currentCtc) || 0,
      expectedCtc: Number(expectedCtc) || 0,
      noticePeriod,
      finalSelectDate,
      finalSelectStatus,
      remarks,
      holdingOfferCtc: hasHoldingOffer ? Number(holdingOfferCtc) || 0 : 0,
      holdingOfferCompany: hasHoldingOffer ? holdingOfferCompany : "",
      holdingOfferDoj: hasHoldingOffer ? holdingOfferDoj : "",
    });
    setTimeout(() => setSaving(false), 300);
  };

  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white";
  const lc = "text-xs font-semibold uppercase tracking-wider text-slate-500";

  const subtitle = `${position?.name}${client ? ` \u00b7 ${client.name}` : ""} \u00b7 Recruiter: ${recruiter?.name ?? "\u2014"}`;

  return (
    <>
      <DetailModalShell
        open={true}
        onClose={onClose}
        accent="emerald"
        initials={initials}
        title={candidate.name}
        subtitle={subtitle}
        statusBadge={!canEdit ? <StatusPill status={finalSelectStatus} /> : undefined}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(true)}
        canEdit={canEdit}
        footer={
          isEditing ? (
            <>
              {state.currentUserRole === "admin" && onDelete && (
                <Button variant="destructive" size="sm" className="mr-auto gap-1.5" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          )
        }
      >
        {!isEditing ? (
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-4">
            <DetailSectionCard>
              <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> Contact &amp; Timeline</DetailSectionTitle>
              <div className="space-y-2.5 text-sm">
                <DetailSectionRow label="Contact No" value={candidate.contactNo || "\u2014"} />
                <DetailSectionRow label="Waiting" value={`${waitingDays} days`} />
                <DetailSectionRow label="Final Select Date" value={finalSelectDate ? formatLongDate(finalSelectDate) : "\u2014"} />
              </div>
            </DetailSectionCard>
            <DetailSectionCard>
              <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> POCs</DetailSectionTitle>
              <div className="space-y-2.5 text-sm">
                <DetailSectionRow label="Client POC" value={spoc?.name ?? "\u2014"} />
                <DetailSectionRow label="H&B SPOC" value={recruiter?.name ?? "\u2014"} />
              </div>
            </DetailSectionCard>
          </div>
          <div className="space-y-4">
            <DetailSectionCard>
              <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> Compensation</DetailSectionTitle>
              <div className="space-y-3">
                <DetailSectionRow label="C. CTC (Lacs)" value={candidate.currentCtc ? `\u20b9 ${candidate.currentCtc}` : "\u2014"} />
                <DetailSectionRow label="E. CTC (Lacs)" value={<span className="font-semibold text-emerald-700">{candidate.expectedCtc ? `\u20b9 ${candidate.expectedCtc}` : "\u2014"}</span>} />
                <DetailSectionRow label="Notice Period" value={candidate.noticePeriod || "\u2014"} />
                {candidate.currentCtc > 0 && candidate.expectedCtc > 0 && (
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-700">
                    Expecting {Math.round(((candidate.expectedCtc - candidate.currentCtc) / candidate.currentCtc) * 100)}% hike
                  </div>
                )}
              </div>
            </DetailSectionCard>
            {candidate.holdingOfferCtc > 0 && (
              <DetailSectionCard>
                <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> Holding Offer</DetailSectionTitle>
                <div className="space-y-2.5 text-sm">
                  <DetailSectionRow label="Offered CTC" value={<span className="font-semibold text-emerald-700">{`\u20b9 ${candidate.holdingOfferCtc} LPA`}</span>} />
                  {candidate.holdingOfferCompany && <DetailSectionRow label="Company" value={candidate.holdingOfferCompany} />}
                  {candidate.holdingOfferDoj && <DetailSectionRow label="DoJ" value={formatLongDate(candidate.holdingOfferDoj)} />}
                </div>
              </DetailSectionCard>
            )}
            <DetailSectionCard>
              <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> Status &amp; Notes</DetailSectionTitle>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  {canEdit ? (
                    <select className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white" value={finalSelectStatus} onChange={(e) => setFinalSelectStatus(e.target.value as FinalSelectStatus)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <StatusPill status={finalSelectStatus} />
                  )}
                </div>
                <div className="text-sm"><span className="text-slate-500 block mb-1">Notes</span><span className="text-slate-700">{candidate.remarks || "\u2014"}</span></div>
                {canEdit && candidate.finalSelectStatus !== "Offer Released" && (
                  <button
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    onClick={() => {
                      setFinalSelectStatus("Offer Released");
                      setPendingOfferRelease(true);
                    }}
                  >
                    <Gift className="h-4 w-4" /> Release Offer
                  </button>
                )}
              </div>
            </DetailSectionCard>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <span className="text-xs text-slate-400">Submitted: {formatLongDate(candidate.submittedAt)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <DetailSectionCard>
            <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> Contact &amp; Timeline</DetailSectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={lc}>Contact No</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-700">{candidate.contactNo || "\u2014"}</div>
              </div>
              <div>
                <div className={lc}>Waiting</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-700">{waitingDays} days</div>
              </div>
              <div>
                <div className={lc}>Final Select Date</div>
                <input type="date" className={`mt-1 ${ic}`} value={finalSelectDate} onChange={(e) => setFinalSelectDate(e.target.value)} />
              </div>
            </div>
          </DetailSectionCard>
          <DetailSectionCard>
            <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> POCs</DetailSectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={lc}>Client POC</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-700">{spoc?.name ?? "\u2014"}</div>
              </div>
              <div>
                <div className={lc}>H&B SPOC</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-700">{recruiter?.name ?? "\u2014"}</div>
              </div>
            </div>
          </DetailSectionCard>
          <DetailSectionCard>
            <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> Compensation</DetailSectionTitle>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={lc}>C. CTC (Lacs)</div>
                <input type="number" min={0} step={0.5} className={`mt-1 ${ic}`} value={currentCtc} onChange={(e) => setCurrentCtc(e.target.value)} />
              </div>
              <div>
                <div className={lc}>E. CTC (Lacs)</div>
                <input type="number" min={0} step={0.5} className={`mt-1 ${ic}`} value={expectedCtc} onChange={(e) => setExpectedCtc(e.target.value)} />
              </div>
              <div>
                <div className={lc}>Notice Period</div>
                <input className={`mt-1 ${ic}`} value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} placeholder="e.g. 30 days" />
              </div>
            </div>
          </DetailSectionCard>
          <DetailSectionCard>
            <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> Holding Offer</DetailSectionTitle>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" checked={hasHoldingOffer} onChange={(e) => setHasHoldingOffer(e.target.checked)} />
                <span className="text-sm text-slate-700">Has holding offer from another company</span>
              </label>
              {hasHoldingOffer && (
                <div className="grid grid-cols-3 gap-3 pl-6">
                  <div><div className={lc}>Offered CTC *</div><input className={`mt-1 ${ic}`} type="number" min={0} step={0.5} value={holdingOfferCtc} onChange={(e) => setHoldingOfferCtc(e.target.value)} placeholder="LPA" /></div>
                  <div><div className={lc}>Company</div><input className={`mt-1 ${ic}`} value={holdingOfferCompany} onChange={(e) => setHoldingOfferCompany(e.target.value)} placeholder="Company name" /></div>
                  <div><div className={lc}>DoJ</div><input className={`mt-1 ${ic}`} type="date" value={holdingOfferDoj} onChange={(e) => setHoldingOfferDoj(e.target.value)} /></div>
                </div>
              )}
            </div>
          </DetailSectionCard>
          <DetailSectionCard>
            <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-emerald-400" /> Status &amp; Notes</DetailSectionTitle>
            <div className="space-y-3">
              <div>
                <div className={lc}>Status</div>
                <select className={`mt-1 ${ic}`} value={finalSelectStatus} onChange={(e) => setFinalSelectStatus(e.target.value as FinalSelectStatus)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className={lc}>Remarks</div>
                <textarea className={`mt-1 ${ic} resize-none`} rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks..." />
              </div>
            </div>
          </DetailSectionCard>
        </div>
      )}

    </DetailModalShell>
      {pendingOfferRelease && (
        <OfferReleaseModal
          candidate={candidate}
          onClose={() => setPendingOfferRelease(false)}
        />
      )}
    </>
  );
}

export default function FinalSelectionPage() {
  const { state, activeFilters, deleteCandidate } = useApp();
  const [clientFilter, setClientFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string | "all">(() => monthKey(new Date()));
  const [detailTarget, setDetailTarget] = useState<string | null>(null);
  const [confirmOfferTarget, setConfirmOfferTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [now] = useState(Date.now);
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const [quickActionTarget, setQuickActionTarget] = useState<{ candidateId: string; status: FinalSelectStatus } | null>(null);
  const { updateFinalSelect } = useApp();

  const isAll = selectedMonth === "all";

  const applyStatusChange = (candidateId: string, status: FinalSelectStatus) => {
    if (status === "Offer Released") {
      setConfirmOfferTarget(candidateId);
      return;
    }
    const candidate = lookups.candidates.get(candidateId);
    if (!candidate) return;
    updateFinalSelect({
      candidateId,
      currentCtc: candidate.currentCtc,
      expectedCtc: candidate.expectedCtc,
      noticePeriod: candidate.noticePeriod,
      finalSelectDate: candidate.finalSelectDate || new Date().toISOString().split("T")[0],
      finalSelectStatus: status,
      remarks: candidate.remarks,
      holdingOfferCtc: candidate.holdingOfferCtc,
      holdingOfferCompany: candidate.holdingOfferCompany,
      holdingOfferDoj: candidate.holdingOfferDoj,
    });
  };

  const handleQuickConfirm = () => {
    if (!quickActionTarget) return;
    applyStatusChange(quickActionTarget.candidateId, quickActionTarget.status);
    setQuickActionTarget(null);
  };

  const monthOptions = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);
  const lookups = useMemo(() => createLookups(state), [state]);

  const rows = useMemo(() => {
    if (!state) return [];
    let candidates = getFinalSelectionCandidates(state, activeFilters);
    if (!isAll) {
      candidates = candidates.filter((c) => monthKey(c.finalSelectDate || c.submittedAt) === selectedMonth);
    }
    if (clientFilter) {
      candidates = candidates.filter((c) => c.clientId === clientFilter);
    }
    if (recruiterFilter) {
      candidates = candidates.filter((c) => c.recruiterId === recruiterFilter);
    }
    if (statusFilter) {
      candidates = candidates.filter((c) => c.finalSelectStatus === statusFilter);
    }
    return candidates;
  }, [state, activeFilters, clientFilter, recruiterFilter, statusFilter, selectedMonth]);

  if (!state) return null;

  const detailCandidate = detailTarget ? lookups.candidates.get(detailTarget) : undefined;

  return (
    <SectionPageLayout
      title="Final Selection"
      accent="emerald"
      filters={
        <>
          <FilterSelect accent="emerald" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="all">All Months</option>
            {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </FilterSelect>
          <FilterSelect accent="emerald" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          <FilterSelect accent="emerald" value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)}>
            <option value="">All Recruiters</option>
            {state.recruiters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </FilterSelect>
          <FilterSelect accent="emerald" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>
        </>
      }
      count={rows.length}
      countLabel={isAll ? "candidates (all months)" : `candidates in ${formatMonthLabel(selectedMonth)}`}
    >
      <SectionTable
        headers={[
          { label: "Date" },
          { label: "Client" },
          { label: "Position" },
          { label: "Candidate" },
          { label: "Notice / LWD" },
          { label: "Status" },
          ...(state.currentUserRole === "admin" || state.currentUserRole === "manager"
            ? [{ label: "Actions", className: "w-20 text-center" as const }]
            : []),
        ]}
        accent="emerald"
      >
        {rows.map((candidate) => {
          const position = lookups.positions.get(candidate.positionId);
          const client = lookups.clients.get(candidate.clientId);
          const canEdit = state.currentUserRole === "admin" || state.currentUserRole === "manager";

          return (
            <SectionRow key={candidate.id} accent="emerald">
              <td className="border-b border-slate-100 whitespace-nowrap px-4 py-3.5 text-slate-600">
                {candidate.finalSelectDate ? formatLongDate(candidate.finalSelectDate) : "\u2014"}
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-slate-800 min-w-0 max-w-[180px] truncate">{client?.name}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-600 min-w-0 max-w-[180px] truncate">{position?.name}</td>
              <td className="border-b border-slate-100 px-4 py-3.5">
                <button className="font-semibold text-emerald-600 hover:text-emerald-800 hover:underline text-left transition-colors" onClick={() => setDetailTarget(candidate.id)}>
                  {candidate.name}
                </button>
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{candidate.noticePeriod || "\u2014"}</td>
              <td className="border-b border-slate-100 px-4 py-3.5"><StatusPill status={candidate.finalSelectStatus} /></td>
              {canEdit && (
              <td className="border-b border-slate-100 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="relative inline-block">
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setOpenActionsFor(openActionsFor === candidate.id ? null : candidate.id); }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {openActionsFor === candidate.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenActionsFor(null)} />
                      <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mark as</div>
                        {STATUS_OPTIONS.filter((s) => s !== candidate.finalSelectStatus).map((s) => (
                          <button
                            key={s}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setOpenActionsFor(null); setQuickActionTarget({ candidateId: candidate.id, status: s }); }}
                          >
                            {s === "Offer Released" ? <><Gift className="h-3.5 w-3.5 text-emerald-500" /> ★ Release Offer</> : s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </td>
              )}
            </SectionRow>
          );
        })}
        {rows.length === 0 && <SectionEmpty colSpan={7} message="No candidates in final selection" />}
      </SectionTable>

      {detailCandidate && (
        <DetailModal
          key={detailCandidate.id}
          candidate={detailCandidate}
          onClose={() => setDetailTarget(null)}
          onDelete={() => { setDeleteTarget(detailTarget); setDetailTarget(null); }}
        />
      )}
      {confirmOfferTarget && lookups.candidates.get(confirmOfferTarget) && (
        <OfferReleaseModal
          key={confirmOfferTarget}
          candidate={lookups.candidates.get(confirmOfferTarget)!}
          onClose={() => setConfirmOfferTarget(null)}
        />
      )}
      {quickActionTarget && (
        <ModalShell
          open={true}
          onClose={() => setQuickActionTarget(null)}
          title="Confirm Status Change"
          accent="emerald"
          size="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setQuickActionTarget(null)}>Cancel</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleQuickConfirm}>Confirm</Button>
            </>
          }
        >
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <AlertTriangle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                Mark <strong className="text-slate-900">{lookups.candidates.get(quickActionTarget.candidateId)?.name ?? "this candidate"}</strong> as <strong className="text-slate-900">{quickActionTarget.status}</strong>?
              </p>
            </div>
          </div>
        </ModalShell>
      )}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) { deleteCandidate(deleteTarget); setDeleteTarget(null); }
        }}
        itemName={deleteTarget ? (lookups.candidates.get(deleteTarget)?.name ?? "this candidate") : ""}
        itemType="candidate"
      />
    </SectionPageLayout>
  );
}
