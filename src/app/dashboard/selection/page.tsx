"use client";

import { useMemo, useState } from "react";
import { Check, XCircle, AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DetailModalShell, DetailSectionCard, DetailSectionTitle, DetailSectionRow } from "@/components/ui/detail-modal-shell";
import { ModalShell } from "@/components/ui/modal-shell";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import {
  SectionPageLayout,
  SectionTable,
  SectionRow,
  SectionEmpty,
} from "@/components/dashboard/section-layout";
import { useApp } from "@/components/providers/app-provider";
import { createLookups, filterOffers, getDataMonths } from "@/lib/data/selectors";
import type { SelectionOfferStatus } from "@/lib/data/types";
import { formatCurrency, formatLongDate, formatMonthLabel, monthKey } from "@/lib/utils";

import { FilterSelect } from "@/components/ui/filter-select";
const STATUS_OPTIONS: SelectionOfferStatus[] = [
  "Offer Declined",
  "Joined",
  "Joining Pending",
];

function DetailModal({
  offer,
  onClose,
  onDelete,
}: {
  offer: NonNullable<ReturnType<ReturnType<typeof createLookups>["offers"]["get"]>>;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const { state, updateSelection } = useApp();
  const userRole = state.currentUserRole;
  const canEdit = userRole === "admin" || userRole === "manager";
  const lookups = useMemo(() => createLookups(state), [state]);
  const candidate = lookups.candidates.get(offer.candidateId);
  const position = lookups.positions.get(offer.positionId);
  const client = lookups.clients.get(offer.clientId);
  const recruiter = lookups.recruiters.get(offer.recruiterId);
  const spocId = candidate?.spocId ?? position?.spocId;
  const spoc = spocId ? lookups.spocs.get(spocId) : undefined;
  const existingJoining = state.joinings.find((j) => j.candidateId === offer.candidateId);

  const [billValue, setBillValue] = useState(String(offer.billValue || ""));
  const [offerDate, setOfferDate] = useState(offer.offerDate);
  const [joiningDate, setJoiningDate] = useState(existingJoining?.joiningDate ?? "");
  const [selectionStatus, setSelectionStatus] = useState<SelectionOfferStatus>(offer.selectionStatus);
  const [remarks, setRemarks] = useState(offer.remarks);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<SelectionOfferStatus | null>(null);
  const [hasHoldingOffer, setHasHoldingOffer] = useState((candidate?.holdingOfferCtc ?? 0) > 0);
  const [holdingOfferCtc, setHoldingOfferCtc] = useState(String(candidate?.holdingOfferCtc || ""));
  const [holdingOfferCompany, setHoldingOfferCompany] = useState(candidate?.holdingOfferCompany ?? "");
  const [holdingOfferDoj, setHoldingOfferDoj] = useState(candidate?.holdingOfferDoj ?? "");

  const initials = (candidate?.name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white";
  const lc = "text-xs font-semibold uppercase tracking-wider text-slate-500";

  const isTerminal = selectionStatus !== "Joining Pending";

  const hasChanges =
    billValue !== String(offer.billValue || "") ||
    offerDate !== offer.offerDate ||
    joiningDate !== (existingJoining?.joiningDate ?? "") ||
    selectionStatus !== offer.selectionStatus ||
    remarks !== offer.remarks ||
    hasHoldingOffer !== ((candidate?.holdingOfferCtc ?? 0) > 0) ||
    holdingOfferCtc !== String(candidate?.holdingOfferCtc || "") ||
    holdingOfferCompany !== (candidate?.holdingOfferCompany ?? "") ||
    holdingOfferDoj !== (candidate?.holdingOfferDoj ?? "");

  const handleSave = () => {
    setSaving(true);
    updateSelection({
      offerId: offer.id,
      candidateId: offer.candidateId,
      positionId: offer.positionId,
      clientId: offer.clientId,
      recruiterId: offer.recruiterId,
      billValue: Number(billValue) || 0,
      offerDate,
      joiningDate,
      selectionStatus,
      remarks,
      holdingOfferCtc: hasHoldingOffer ? Number(holdingOfferCtc) || 0 : 0,
      holdingOfferCompany: hasHoldingOffer ? holdingOfferCompany : "",
      holdingOfferDoj: hasHoldingOffer ? holdingOfferDoj : "",
    });
    setTimeout(() => setSaving(false), 300);
  };

  const handleQuickAction = (newStatus: SelectionOfferStatus) => {
    updateSelection({
      offerId: offer.id,
      candidateId: offer.candidateId,
      positionId: offer.positionId,
      clientId: offer.clientId,
      recruiterId: offer.recruiterId,
      billValue: Number(billValue) || 0,
      offerDate,
      joiningDate,
      selectionStatus: newStatus,
      remarks,
      holdingOfferCtc: hasHoldingOffer ? Number(holdingOfferCtc) || 0 : 0,
      holdingOfferCompany: hasHoldingOffer ? holdingOfferCompany : "",
      holdingOfferDoj: hasHoldingOffer ? holdingOfferDoj : "",
    });
    setConfirmAction(null);
    onClose();
  };

  const resetForm = () => {
    setBillValue(String(offer.billValue || ""));
    setOfferDate(offer.offerDate);
    setJoiningDate(existingJoining?.joiningDate ?? "");
    setSelectionStatus(offer.selectionStatus);
    setRemarks(offer.remarks);
    setHasHoldingOffer((candidate?.holdingOfferCtc ?? 0) > 0);
    setHoldingOfferCtc(String(candidate?.holdingOfferCtc || ""));
    setHoldingOfferCompany(candidate?.holdingOfferCompany ?? "");
    setHoldingOfferDoj(candidate?.holdingOfferDoj ?? "");
  };

  const subtitle = `${position?.name} \u00b7 ${client?.name} \u00b7 Recruiter: ${recruiter?.name ?? "\u2014"}`;

  return (
    <>
      <DetailModalShell
        open={true}
        onClose={onClose}
        accent="teal"
        initials={initials}
        title={candidate?.name ?? "Unknown"}
        subtitle={subtitle}
        statusBadge={<StatusPill status={selectionStatus} />}
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
              <Button variant="outline" size="sm" onClick={() => { resetForm(); setIsEditing(false); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>{saving ? "Saving..." : "Save Changes"}</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          )
        }
      >
        {!isEditing ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 p-5 text-white shadow-md">
              <div className="text-xs font-semibold uppercase tracking-widest text-teal-100/80">Bill Value</div>
              <div className="mt-1 text-3xl font-bold tracking-tight">{billValue ? formatCurrency(Number(billValue)) : "\u2014"}</div>
              <div className="mt-1 text-sm text-teal-100/70">Offer: {formatCurrency(offer.ctc)} \u00b7 {position?.name}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <DetailSectionCard>
                  <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Offer Details</DetailSectionTitle>
                  <div className="space-y-2.5 text-sm">
                    <DetailSectionRow label="Contact No" value={candidate?.contactNo || "\u2014"} />
                    <DetailSectionRow label="Offered CTC" value={formatCurrency(offer.ctc)} />
                    <DetailSectionRow label="Offer Date" value={offerDate ? formatLongDate(offerDate) : "\u2014"} />
                    <DetailSectionRow label="Joining Date" value={joiningDate ? formatLongDate(joiningDate) : "\u2014"} />
                  </div>
                </DetailSectionCard>

                {candidate && (
                  <DetailSectionCard>
                    <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Submission Info</DetailSectionTitle>
                    <div className="space-y-2.5 text-sm">
                      <DetailSectionRow label="Submitted" value={formatLongDate(candidate.submittedAt)} />
                      <DetailSectionRow label="Source" value={candidate.source || "\u2014"} />
                      <DetailSectionRow label="Current CTC" value={candidate.currentCtc ? formatCurrency(candidate.currentCtc) : "\u2014"} />
                      <DetailSectionRow label="Expected CTC" value={candidate.expectedCtc ? formatCurrency(candidate.expectedCtc) : "\u2014"} />
                      <DetailSectionRow label="Notice" value={candidate.noticePeriod || "\u2014"} />
                      <DetailSectionRow label="Experience" value={candidate.experience ? `${candidate.experience} yrs` : "\u2014"} />
                      <DetailSectionRow label="Company" value={candidate.currentCompany || "\u2014"} />
                      <DetailSectionRow label="Location" value={candidate.location || "\u2014"} />
                    </div>
                  </DetailSectionCard>
                )}

                {candidate?.finalSelectDate && (
                  <DetailSectionCard>
                    <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Final Selection</DetailSectionTitle>
                    <div className="space-y-2.5 text-sm">
                      <DetailSectionRow label="Date" value={formatLongDate(candidate.finalSelectDate)} />
                      <DetailSectionRow label="Status" value={<StatusPill status={candidate.finalSelectStatus} />} />
                    </div>
                  </DetailSectionCard>
                )}
              </div>

              <div className="space-y-4">
                {candidate && candidate.holdingOfferCtc > 0 && (
                  <DetailSectionCard>
                    <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Holding Offer</DetailSectionTitle>
                    <div className="space-y-2.5 text-sm">
                      <DetailSectionRow label="Offered CTC" value={<span className="font-semibold text-teal-700">{`\u20b9 ${candidate.holdingOfferCtc} LPA`}</span>} />
                      {candidate.holdingOfferCompany && <DetailSectionRow label="Company" value={candidate.holdingOfferCompany} />}
                      {candidate.holdingOfferDoj && <DetailSectionRow label="DoJ" value={formatLongDate(candidate.holdingOfferDoj)} />}
                    </div>
                  </DetailSectionCard>
                )}

                <DetailSectionCard>
                  <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> POCs</DetailSectionTitle>
                  <div className="space-y-2.5 text-sm">
                    <DetailSectionRow label="Recruiter" value={recruiter?.name ?? "\u2014"} />
                    <DetailSectionRow label="SPOC" value={spoc?.name ?? "\u2014"} />
                  </div>
                </DetailSectionCard>

                <DetailSectionCard>
                  <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Status &amp; Notes</DetailSectionTitle>
                  <div className="space-y-2.5 text-sm">
                    <DetailSectionRow label="Status" value={<StatusPill status={selectionStatus} />} />
                    {canEdit && !isTerminal && (
                      <div className="flex gap-2 pt-1">
                        <button
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                          onClick={() => setConfirmAction("Joined")}
                        >
                          <Check className="h-3.5 w-3.5" /> Mark Joined
                        </button>
                        <button
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                          onClick={() => setConfirmAction("Offer Declined")}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Decline
                        </button>
                      </div>
                    )}
                    <DetailSectionRow label="Notes" value={<span className="text-right max-w-[200px]">{remarks || "\u2014"}</span>} />
                  </div>
                </DetailSectionCard>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-4">
              <DetailSectionCard>
                <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Offer Details</DetailSectionTitle>
                <div className="space-y-3">
                  <div><div className={lc}>Contact No</div><div className="mt-1 text-sm text-slate-700">{candidate?.contactNo || "\u2014"}</div></div>
                  <div><div className={lc}>Offered CTC</div><div className="mt-1 text-sm text-slate-700">{formatCurrency(offer.ctc)}</div></div>
                  <div><div className={lc}>Offer Date</div><input type="date" className={ic} value={offerDate} onChange={(e) => setOfferDate(e.target.value)} /></div>
                  <div><div className={lc}>Joining Date</div><input type="date" className={ic} value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} /></div>
                </div>
              </DetailSectionCard>
              <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span className="h-3 w-0.5 rounded-full bg-teal-500" /> Billing
                </div>
                <div className="space-y-3">
                  <div><div className={lc}>Bill Value</div><input type="number" min={0} step={0.5} className={ic + " border-teal-300 text-lg font-bold text-teal-800"} value={billValue} onChange={(e) => setBillValue(e.target.value)} placeholder="Enter bill value" /></div>
                </div>
              </div>
              {candidate && (
                <DetailSectionCard>
                  <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Submission Info</DetailSectionTitle>
                  <div className="space-y-2 text-sm">
                    <DetailSectionRow label="Submitted" value={formatLongDate(candidate.submittedAt)} />
                    <DetailSectionRow label="Source" value={candidate.source || "\u2014"} />
                    <DetailSectionRow label="Current CTC" value={candidate.currentCtc ? formatCurrency(candidate.currentCtc) : "\u2014"} />
                    <DetailSectionRow label="Expected CTC" value={candidate.expectedCtc ? formatCurrency(candidate.expectedCtc) : "\u2014"} />
                  </div>
                </DetailSectionCard>
              )}
            </div>
            <div className="space-y-4">
              <DetailSectionCard>
                <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Holding Offer</DetailSectionTitle>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" checked={hasHoldingOffer} onChange={(e) => setHasHoldingOffer(e.target.checked)} />
                    <span className="text-sm text-slate-700">Has holding offer from another company</span>
                  </label>
                  {hasHoldingOffer && (
                    <div className="space-y-3 pl-6">
                      <div><div className={lc}>Offered CTC *</div><input className={`mt-1 ${ic}`} type="number" min={0} step={0.5} value={holdingOfferCtc} onChange={(e) => setHoldingOfferCtc(e.target.value)} placeholder="LPA" /></div>
                      <div><div className={lc}>Company</div><input className={`mt-1 ${ic}`} value={holdingOfferCompany} onChange={(e) => setHoldingOfferCompany(e.target.value)} placeholder="Company name" /></div>
                      <div><div className={lc}>DoJ</div><input className={`mt-1 ${ic}`} type="date" value={holdingOfferDoj} onChange={(e) => setHoldingOfferDoj(e.target.value)} /></div>
                    </div>
                  )}
                </div>
              </DetailSectionCard>
              <DetailSectionCard>
                <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> POCs</DetailSectionTitle>
                <div className="space-y-3">
                  <div><div className={lc}>Recruiter</div><div className="mt-1 text-sm text-slate-700">{recruiter?.name ?? "\u2014"}</div></div>
                  <div><div className={lc}>SPOC</div><div className="mt-1 text-sm text-slate-700">{spoc?.name ?? "\u2014"}</div></div>
                </div>
              </DetailSectionCard>
              <DetailSectionCard>
                <DetailSectionTitle><span className="h-3 w-0.5 rounded-full bg-teal-400" /> Status &amp; Notes</DetailSectionTitle>
                <div className="space-y-3">
                  <div><div className={lc}>Status</div><select className={ic} value={selectionStatus} onChange={(e) => setSelectionStatus(e.target.value as SelectionOfferStatus)}>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><div className={lc}>Remarks</div><textarea className={ic} rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks..." /></div>
                </div>
              </DetailSectionCard>
            </div>
          </div>
        )}
      </DetailModalShell>

      {confirmAction && (
        <ModalShell
          open={true}
          onClose={() => setConfirmAction(null)}
          title={confirmAction === "Joined" ? "Mark as Joined?" : "Mark as Offer Declined?"}
          accent="teal"
          size="sm"
          footer={
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button size="sm" variant={confirmAction === "Joined" ? "default" : "destructive"} onClick={() => handleQuickAction(confirmAction)}>Confirm</Button>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-3 text-center py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-sm text-slate-500">
              {confirmAction === "Joined"
                ? `This will mark ${candidate?.name} as Joined and create a joining record.`
                : `This will mark the offer as declined for ${candidate?.name}.`}
            </p>
          </div>
        </ModalShell>
      )}
    </>
  );
}

export default function SelectionPage() {
  const { state, activeFilters } = useApp();
  const [clientFilter, setClientFilter] = useState("");
  const [spocFilter, setSpocFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [detailTarget, setDetailTarget] = useState<string | null>(null);
  const [quickActionTarget, setQuickActionTarget] = useState<{ offerId: string; action: SelectionOfferStatus } | null>(null);

  const lookups = useMemo(() => createLookups(state), [state]);
  const monthOptions = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);

  const rows = useMemo(() => {
    if (!state) return [];
    let offers = filterOffers(state, activeFilters);
    if (clientFilter) {
      offers = offers.filter((o) => o.clientId === clientFilter);
    }
    if (recruiterFilter) {
      offers = offers.filter((o) => o.recruiterId === recruiterFilter);
    }
    if (spocFilter) {
      offers = offers.filter((o) => {
        const cand = lookups.candidates.get(o.candidateId);
        return cand?.spocId === spocFilter;
      });
    }
    if (monthFilter) {
      offers = offers.filter((o) => monthKey(o.offerDate) === monthFilter);
    }
    return offers;
  }, [state, activeFilters, clientFilter, spocFilter, recruiterFilter, monthFilter, lookups]);

  const { updateSelection, deleteCandidate } = useApp();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleQuickAction = () => {
    if (!quickActionTarget) return;
    const offer = lookups.offers.get(quickActionTarget.offerId);
    if (!offer) return;
    const candidate = lookups.candidates.get(offer.candidateId);
    updateSelection({
      offerId: offer.id,
      candidateId: offer.candidateId,
      positionId: offer.positionId,
      clientId: offer.clientId,
      recruiterId: offer.recruiterId,
      billValue: offer.billValue,
      offerDate: offer.offerDate,
      joiningDate: "",
      selectionStatus: quickActionTarget.action,
      remarks: offer.remarks,
      holdingOfferCtc: candidate?.holdingOfferCtc ?? 0,
      holdingOfferCompany: candidate?.holdingOfferCompany ?? "",
      holdingOfferDoj: candidate?.holdingOfferDoj ?? "",
    });
    setQuickActionTarget(null);
  };

  if (!state) return null;

  const detailOffer = detailTarget ? lookups.offers.get(detailTarget) : undefined;

  return (
    <SectionPageLayout
      title="Selection"
      accent="teal"
      filters={
        <>
          <FilterSelect accent="teal" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          <FilterSelect accent="teal" value={spocFilter} onChange={(e) => setSpocFilter(e.target.value)}>
            <option value="">All SPOCs</option>
            {state.spocs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FilterSelect>
          <FilterSelect accent="teal" value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)}>
            <option value="">All Recruiters</option>
            {state.recruiters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </FilterSelect>
          <FilterSelect accent="teal" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">All Months</option>
            {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </FilterSelect>
        </>
      }
      count={rows.length}
      countLabel="offers in selection"
    >
      <SectionTable
        headers={[
          { label: "Client" },
          { label: "SPOC" },
          { label: "Candidate" },
          { label: "Position" },
          { label: "Bill Value" },
          { label: "Status" },
          ...(state.currentUserRole === "admin" || state.currentUserRole === "manager"
            ? [{ label: "Actions", className: "w-36" as const }]
            : []),
        ]}
        accent="teal"
      >
        {rows.map((offer) => {
          const candidate = lookups.candidates.get(offer.candidateId);
          const position = lookups.positions.get(offer.positionId);
          const clientO = lookups.clients.get(offer.clientId);
          const spocId = candidate?.spocId ?? position?.spocId;
          const spoc = spocId ? lookups.spocs.get(spocId) : undefined;
          const isTerminal = offer.selectionStatus !== "Joining Pending";
          const canEdit = state.currentUserRole === "admin" || state.currentUserRole === "manager";

          return (
            <SectionRow key={offer.id} accent="teal">
              <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-slate-800">{clientO?.name}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{spoc?.name ?? "\u2014"}</td>
              <td className="border-b border-slate-100 px-4 py-3.5">
                <button className="font-semibold text-teal-600 hover:text-teal-800 hover:underline text-left transition-colors" onClick={() => setDetailTarget(offer.id)}>
                  {candidate?.name ?? "Unknown"}
                </button>
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-600">{position?.name}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-slate-800">{offer.billValue ? formatCurrency(offer.billValue) : "\u2014"}</td>
              <td className="border-b border-slate-100 px-4 py-3.5"><StatusPill status={offer.selectionStatus} /></td>
              {canEdit && (
              <td className="border-b border-slate-100 px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  {!isTerminal && candidate && (
                    <div className="flex gap-1.5">
                      <button
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 whitespace-nowrap"
                        onClick={() => setQuickActionTarget({ offerId: offer.id, action: "Joined" })}
                      >
                        <Check className="h-3.5 w-3.5" /> Joined
                      </button>
                      <button
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 whitespace-nowrap"
                        onClick={() => setQuickActionTarget({ offerId: offer.id, action: "Offer Declined" })}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Decline
                      </button>
                    </div>
                  )}
                  {isTerminal && (
                    <span className="text-xs text-slate-400 italic">Closed</span>
                  )}
                  {state.currentUserRole === "admin" && candidate && (
                    <button
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      onClick={() => setDeleteTarget(candidate.id)}
                      title="Delete candidate"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
              )}
            </SectionRow>
          );
        })}
        {rows.length === 0 && <SectionEmpty colSpan={7} message="No offers in selection" />}
      </SectionTable>

      {detailOffer && (
        <DetailModal
          key={detailOffer.id}
          offer={detailOffer}
          onClose={() => setDetailTarget(null)}
          onDelete={() => {
            const cand = detailOffer ? lookups.candidates.get(detailOffer.candidateId) : undefined;
            if (cand) { setDeleteTarget(cand.id); setDetailTarget(null); }
          }}
        />
      )}

      {quickActionTarget && (() => {
        const offer = lookups.offers.get(quickActionTarget.offerId);
        const candidate = offer ? lookups.candidates.get(offer.candidateId) : undefined;
        const isJoined = quickActionTarget.action === "Joined";
        return (
          <ModalShell
            open={true}
            onClose={() => setQuickActionTarget(null)}
            title={isJoined ? "Mark as Joined?" : "Mark as Offer Declined?"}
            accent="teal"
            size="sm"
            footer={
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setQuickActionTarget(null)}>Cancel</Button>
                <Button size="sm" variant={isJoined ? "default" : "destructive"} onClick={handleQuickAction}>Confirm</Button>
              </div>
            }
          >
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-sm text-slate-500">
                {isJoined
                  ? `This will mark ${candidate?.name ?? "Unknown"} as Joined and create a joining record.`
                  : `This will mark the offer as declined for ${candidate?.name ?? "Unknown"}.`}
              </p>
            </div>
          </ModalShell>
        );
      })()}
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
