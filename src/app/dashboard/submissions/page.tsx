"use client";

import { useMemo, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, ChevronDown, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { DetailModalShell, DetailSectionCard, DetailSectionTitle, DetailSectionRow } from "@/components/ui/detail-modal-shell";
import { ModalShell } from "@/components/ui/modal-shell";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { StepFormModal } from "@/components/ui/step-form-modal";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  SectionPageLayout,
  SectionTable,
  SectionRow,
  SectionEmpty,
} from "@/components/dashboard/section-layout";
import { useApp } from "@/components/providers/app-provider";
import { createLookups, getDataMonths } from "@/lib/data/selectors";
import {
  buildCandidatePayload,
  CANDIDATE_SOURCES,
  validateCandidatePayload,
} from "@/lib/data/candidate-entry";
import type { Candidate, CandidateStage } from "@/lib/data/types";
import { formatLongDate, formatMonthLabel, monthKey } from "@/lib/utils";

const TERMINAL_STAGES: CandidateStage[] = ["Screen Reject", "Drop", "Duplicate", "Rejected"];

function AddSubmissionModal({ onClose }: { onClose: () => void }) {
  const { state, addCandidate, currentRecruiterId } = useApp();
  const lookups = useMemo(() => createLookups(state), [state]);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [emailId, setEmailId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [source, setSource] = useState("LinkedIn");
  const [technology, setTechnology] = useState("");
  const [currentCtc, setCurrentCtc] = useState("");
  const [expectedCtc, setExpectedCtc] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [requisitionId, setRequisitionId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submittedAt, setSubmittedAt] = useState(() => new Date().toISOString().split("T")[0]);
  const [hasHoldingOffer, setHasHoldingOffer] = useState(false);
  const [holdingOfferCtc, setHoldingOfferCtc] = useState("");
  const [holdingOfferCompany, setHoldingOfferCompany] = useState("");
  const [holdingOfferDoj, setHoldingOfferDoj] = useState("");

  const selectedPosition = positionId ? lookups.positions.get(positionId) : undefined;
  const recruiterReady = !!currentRecruiterId;

  const canNext = step === 1 ? !!(name.trim() && contactNo.trim() && emailId.trim()) : step === 2 ? !!positionId : true;
  const isValid = name.trim() && positionId;
  const steps = ["Candidate Info", "Position Details", "Compensation & Exp.", "Review"];

  const handleSubmit = () => {
    if (!isValid || !selectedPosition) return;
    if (!currentRecruiterId) { toast.error("Your recruiter profile is still loading. Please wait a moment and try again."); return; }
    const payload = buildCandidatePayload({ name, contactNo, emailId, source, remarks, technology, currentCtc: Number(currentCtc) || 0, expectedCtc: Number(expectedCtc) || 0, noticePeriod, currentCompany, experience: Number(experience) || 0, location, requisitionId, submittedAt, holdingOfferCtc: hasHoldingOffer ? Number(holdingOfferCtc) || 0 : 0, holdingOfferCompany: hasHoldingOffer ? holdingOfferCompany : "", holdingOfferDoj: hasHoldingOffer ? holdingOfferDoj : "" }, selectedPosition, currentRecruiterId);
    const validationError = validateCandidatePayload(payload);
    if (validationError) { toast.error(validationError); return; }
    addCandidate(payload);
    toast.success(`${payload.name} added successfully.`);
    onClose();
  };

  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 bg-white";
  const lc = "text-xs font-semibold uppercase tracking-wider text-slate-500";
  const sc = ic;
  const tc = ic + " resize-none";

  return (
    <StepFormModal
      open={true}
      onClose={onClose}
      title="Add Submission"
      accent="violet"
      size="xl"
      steps={["Candidate Info", "Position Details", "Compensation & Exp.", "Review"]}
      currentStep={step}
      onStepChange={setStep}
      canNext={canNext}
      isValid={!!isValid && recruiterReady}
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitLabel="Submit"
    >
          {step === 1 && (
            <div className="space-y-4">
              <div><label className={lc}>Candidate Name *</label><input className={`mt-1.5 ${ic}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lc}>Contact No</label><input className={`mt-1.5 ${ic}`} value={contactNo} onChange={(e) => setContactNo(e.target.value)} placeholder="Phone number" /></div>
                <div><label className={lc}>Email ID</label><input className={`mt-1.5 ${ic}`} type="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} placeholder="Email address" /></div>
              </div>
              <div><label className={lc}>Source</label><select className={`mt-1.5 ${sc}`} value={source} onChange={(e) => setSource(e.target.value)}>{CANDIDATE_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className={lc}>Submission Date</label><input type="date" className={`mt-1.5 ${ic}`} value={submittedAt} onChange={(e) => setSubmittedAt(e.target.value)} /></div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div><label className={lc}>Position *</label><select className={`mt-1.5 ${sc}`} value={positionId} onChange={(e) => setPositionId(e.target.value)}><option value="">Select position</option>{state.positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lc}>Client</label><input className={`mt-1.5 ${ic} bg-slate-50 text-slate-500`} value={selectedPosition ? lookups.clients.get(selectedPosition.clientId)?.name ?? "" : ""} readOnly disabled /></div>
                <div><label className={lc}>Requisition ID</label><input className={`mt-1.5 ${ic}`} value={requisitionId} onChange={(e) => setRequisitionId(e.target.value)} placeholder="External req ID" /></div>
                <div><label className={lc}>POC Name</label><input className={`mt-1.5 ${ic} bg-slate-50 text-slate-500`} value={selectedPosition ? lookups.spocs.get(selectedPosition.spocId)?.name ?? "" : ""} readOnly disabled /></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lc}>Current CTC (LPA)</label><input className={`mt-1.5 ${ic}`} type="number" min={0} step={0.5} value={currentCtc} onChange={(e) => setCurrentCtc(e.target.value)} placeholder="0" /></div>
                <div><label className={lc}>Expected CTC (LPA)</label><input className={`mt-1.5 ${ic}`} type="number" min={0} step={0.5} value={expectedCtc} onChange={(e) => setExpectedCtc(e.target.value)} placeholder="0" /></div>
                <div><label className={lc}>Notice Period / LWD</label><input className={`mt-1.5 ${ic}`} value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} placeholder="e.g. 30 days" /></div>
                <div><label className={lc}>Current Company</label><input className={`mt-1.5 ${ic}`} value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} placeholder="Company name" /></div>
                <div><label className={lc}>Location</label><input className={`mt-1.5 ${ic}`} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City" /></div>
                <div><label className={lc}>Experience (Years)</label><input className={`mt-1.5 ${ic}`} type="number" min={0} step={0.5} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="0" /></div>
                <div><label className={lc}>Technology</label><input className={`mt-1.5 ${ic}`} value={technology} onChange={(e) => setTechnology(e.target.value)} placeholder="e.g. React" /></div>
              </div>
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-violet-400" /> Holding Offer</div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" checked={hasHoldingOffer} onChange={(e) => setHasHoldingOffer(e.target.checked)} />
                    <span className="text-sm text-slate-700">Does the candidate have any holding offers from other company?</span>
                  </label>
                  {hasHoldingOffer && (
                    <div className="grid grid-cols-3 gap-3 pl-6">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Offered CTC *</label>
                        <input className={`mt-1 ${ic}`} type="number" min={0} step={0.5} value={holdingOfferCtc} onChange={(e) => setHoldingOfferCtc(e.target.value)} placeholder="LPA" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Company</label>
                        <input className={`mt-1 ${ic}`} value={holdingOfferCompany} onChange={(e) => setHoldingOfferCompany(e.target.value)} placeholder="Company name" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">DoJ</label>
                        <input className={`mt-1 ${ic}`} type="date" value={holdingOfferDoj} onChange={(e) => setHoldingOfferDoj(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><Check className="h-3 w-3" /> Summary</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  {[["Name", name],["Contact", contactNo],["Email", emailId],["Source", source],["Submission Date", submittedAt],["Position", selectedPosition?.name ?? "—"],["Client", selectedPosition ? lookups.clients.get(selectedPosition.clientId)?.name ?? "" : "—"],["Requisition ID", requisitionId || "—"],["Current CTC", currentCtc ? `₹ ${currentCtc} LPA` : "—"],["Expected CTC", expectedCtc ? `₹ ${expectedCtc} LPA` : "—"],["Notice Period", noticePeriod || "—"],["Company", currentCompany || "—"],["Location", location || "—"],["Experience", experience ? `${experience} yrs` : "—"],["Technology", technology || "—"],["Holding Offer CTC", hasHoldingOffer && holdingOfferCtc ? `₹ ${holdingOfferCtc} LPA` : "—"],["Holding Offer Company", hasHoldingOffer && holdingOfferCompany ? holdingOfferCompany : "—"],["Holding Offer DoJ", hasHoldingOffer && holdingOfferDoj ? holdingOfferDoj : "—"]].map(([l, v]) => (
                    <div key={l} className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-500">{l}</span><span className="font-medium text-slate-800">{v}</span></div>
                  ))}
                </div>
              </div>
              <div><label className={lc}>Remarks</label><textarea className={`mt-1.5 ${tc}`} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes" /></div>
            </div>
          )}
    </StepFormModal>
  );
}

function DetailModal({
  candidate,
  onClose,
  onDelete,
}: {
  candidate: Candidate;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const { state, updateCandidateAll, currentRecruiterId } = useApp();
  const isOwner = candidate.recruiterId === currentRecruiterId;
  const isAdmin = state.currentUserRole === "admin";
  const canEdit = isOwner || isAdmin;
  const lookups = useMemo(() => createLookups(state), [state]);
  const position = lookups.positions.get(candidate.positionId);
  const client = lookups.clients.get(candidate.clientId);
  const recruiter = lookups.recruiters.get(candidate.recruiterId);
  const spoc = lookups.spocs.get(candidate.spocId);

  const [name, setName] = useState(candidate.name);
  const [contactNo, setContactNo] = useState(candidate.contactNo);
  const [emailId, setEmailId] = useState(candidate.emailId);
  const [positionId, setPositionId] = useState(candidate.positionId);
  const [source, setSource] = useState(candidate.source);
  const [technology, setTechnology] = useState(candidate.technology);
  const [currentCtc, setCurrentCtc] = useState(String(candidate.currentCtc || ""));
  const [expectedCtc, setExpectedCtc] = useState(String(candidate.expectedCtc || ""));
  const [noticePeriod, setNoticePeriod] = useState(candidate.noticePeriod);
  const [currentCompany, setCurrentCompany] = useState(candidate.currentCompany);
  const [experience, setExperience] = useState(String(candidate.experience || ""));
  const [location, setLocation] = useState(candidate.location);
  const [requisitionId, setRequisitionId] = useState(candidate.requisitionId);
  const [remarks, setRemarks] = useState(candidate.remarks);
  const [stage, setStage] = useState<CandidateStage>(candidate.stage);
  const [hasHoldingOffer, setHasHoldingOffer] = useState(candidate.holdingOfferCtc > 0);
  const [holdingOfferCtc, setHoldingOfferCtc] = useState(String(candidate.holdingOfferCtc || ""));
  const [holdingOfferCompany, setHoldingOfferCompany] = useState(candidate.holdingOfferCompany ?? "");
  const [holdingOfferDoj, setHoldingOfferDoj] = useState(candidate.holdingOfferDoj ?? "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const stageOrder: CandidateStage[] = ["CV Submitted", "Interview", "Final Selection", "Offer", "Joined"];
  const initials = candidate.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const selectedPosition = positionId ? lookups.positions.get(positionId) : undefined;
  const isTerminal = TERMINAL_STAGES.includes(candidate.stage);

  const hasChanges =
    name !== candidate.name ||
    contactNo !== candidate.contactNo ||
    emailId !== candidate.emailId ||
    positionId !== candidate.positionId ||
    source !== candidate.source ||
    technology !== candidate.technology ||
    currentCtc !== String(candidate.currentCtc || "") ||
    expectedCtc !== String(candidate.expectedCtc || "") ||
    noticePeriod !== candidate.noticePeriod ||
    currentCompany !== candidate.currentCompany ||
    experience !== String(candidate.experience || "") ||
    location !== candidate.location ||
    requisitionId !== candidate.requisitionId ||
    remarks !== candidate.remarks ||
    stage !== candidate.stage ||
    (hasHoldingOffer ? Number(holdingOfferCtc) || 0 : 0) !== candidate.holdingOfferCtc ||
    holdingOfferCompany !== candidate.holdingOfferCompany ||
    holdingOfferDoj !== candidate.holdingOfferDoj;

  const handleSave = () => {
    if (!canEdit || !selectedPosition) return;

    const payload = buildCandidatePayload(
      {
        name,
        contactNo,
        emailId,
        source,
        remarks,
        technology,
        currentCtc: Number(currentCtc) || 0,
        expectedCtc: Number(expectedCtc) || 0,
        noticePeriod,
        currentCompany,
        experience: Number(experience) || 0,
        location,
        requisitionId,
        stage,
        submittedAt: candidate.submittedAt,
        finalSelectDate: candidate.finalSelectDate,
        finalSelectStatus: candidate.finalSelectStatus,
        holdingOfferCtc: hasHoldingOffer ? Number(holdingOfferCtc) || 0 : 0,
        holdingOfferCompany: hasHoldingOffer ? holdingOfferCompany : "",
        holdingOfferDoj: hasHoldingOffer ? holdingOfferDoj : "",
      },
      selectedPosition,
      candidate.recruiterId
    );

    const validationError = validateCandidatePayload(payload);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    updateCandidateAll({
      candidateId: candidate.id,
      candidate: payload,
    });
    toast.success("Candidate updated.");
    setTimeout(() => setSaving(false), 300);
  };

  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 bg-white";
  const lc = "text-xs font-semibold uppercase tracking-wider text-slate-500";

  const statusBadge = !isEditing ? (
    <>{isTerminal ? <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Terminal</span> : <StatusPill status={candidate.stage} />}</>
  ) : undefined;

  const subtitle = `${position?.name ?? ""}${client ? ` · ${client.name}` : ""} · Recruiter: ${recruiter?.name ?? "—"}`;

  return (
    <DetailModalShell
      open={true}
      onClose={onClose}
      accent="violet"
      initials={initials}
      title={candidate.name}
      subtitle={subtitle}
      statusBadge={statusBadge}
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
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        )
      }
    >
      {/* Tags row */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {candidate.source && <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">{candidate.source}</span>}
        {candidate.experience > 0 && <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-medium text-sky-700">{candidate.experience} yrs</span>}
        {candidate.technology && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">{candidate.technology}</span>}
        {candidate.currentCompany && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">{candidate.currentCompany}</span>}
      </div>

      {!isEditing ? (
            /* ▸▸▸ VIEW MODE ▸▸▸ */
            <div className="grid grid-cols-2 gap-5">
              {/* Left column */}
              <div className="space-y-4">
                {/* Contact Card */}
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-3 w-0.5 rounded-full bg-violet-400" /> Contact
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Phone</span><span className="font-medium text-slate-800">{candidate.contactNo || "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-800">{candidate.emailId || "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Location</span><span className="font-medium text-slate-800">{candidate.location || "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Requisition ID</span><span className="font-medium text-slate-800">{candidate.requisitionId || "—"}</span></div>
                  </div>
                </div>

                {/* Experience Card */}
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-3 w-0.5 rounded-full bg-violet-400" /> Experience
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Company</span><span className="font-medium text-slate-800">{candidate.currentCompany || "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Total Exp</span><span className="font-medium text-slate-800">{candidate.experience ? `${candidate.experience} yrs` : "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Notice Period</span><span className="font-medium text-slate-800">{candidate.noticePeriod || "—"}</span></div>
                  </div>
                </div>

                {/* Position Card */}
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-3 w-0.5 rounded-full bg-violet-400" /> Position
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between"><span className="text-slate-500">Position</span><span className="font-medium text-slate-800">{position?.name || "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Client</span><span className="font-medium text-slate-800">{client?.name || "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Client POC</span><span className="font-medium text-slate-800">{spoc?.name || "—"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-slate-500">Recruiter</span><span className="font-medium text-slate-800">{recruiter?.name || "—"}</span></div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Pipeline Card */}
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-3 w-0.5 rounded-full bg-violet-400" /> Pipeline
                  </div>
                  {isTerminal ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <p className="text-sm font-semibold text-red-700">{candidate.stage}</p>
                      <p className="text-xs text-slate-500">Candidate pipeline ended</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {stageOrder.map((stageName, i) => {
                        const idx = stageOrder.indexOf(candidate.stage);
                        const done = i < idx;
                        const current = i === idx;
                        return (
                          <div key={stageName} className="flex items-start gap-3 pb-3 last:pb-0">
                            <div className="flex flex-col items-center">
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 ${
                                done ? "bg-violet-600 text-white ring-violet-300" :
                                current ? "bg-violet-600 text-white ring-violet-300 shadow-md" :
                                "bg-slate-100 text-slate-400 ring-slate-200"
                              }`}>
                                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                              </div>
                              {i < stageOrder.length - 1 && <div className={`mt-1 h-5 w-0.5 rounded-full ${done ? "bg-violet-300" : "bg-slate-200"}`} />}
                            </div>
                            <div className="pt-1">
                              <div className={`text-sm font-medium ${current ? "text-violet-700" : done ? "text-slate-500" : "text-slate-400"}`}>{stageName}</div>
                              {current && <div className="text-[11px] font-medium text-violet-500">Current</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Compensation Card */}
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-3 w-0.5 rounded-full bg-violet-400" /> Compensation
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1"><span className="text-slate-500">Current CTC</span><span className="font-semibold text-slate-800">{candidate.currentCtc ? `₹ ${candidate.currentCtc} LPA` : "—"}</span></div>
                      <div className="h-2 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-300" style={{ width: `${Math.min((candidate.currentCtc || 0) / 30 * 100, 100)}%` }} /></div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1"><span className="text-slate-500">Expected CTC</span><span className="font-semibold text-violet-700">{candidate.expectedCtc ? `₹ ${candidate.expectedCtc} LPA` : "—"}</span></div>
                      <div className="h-2 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min((candidate.expectedCtc || 0) / 30 * 100, 100)}%` }} /></div>
                    </div>
                    {candidate.currentCtc > 0 && candidate.expectedCtc > 0 && (
                      <div className="rounded-lg bg-violet-50 px-3 py-2 text-center text-xs font-medium text-violet-700">
                        Expecting {Math.round(((candidate.expectedCtc - candidate.currentCtc) / candidate.currentCtc) * 100)}% hike
                      </div>
                    )}
                  </div>
                </div>

                {/* Holding Offer Card */}
                {candidate.holdingOfferCtc > 0 && (
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span className="h-3 w-0.5 rounded-full bg-violet-400" /> Holding Offer
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-500">Offered CTC</span><span className="font-semibold text-violet-700">₹ {candidate.holdingOfferCtc} LPA</span></div>
                      {candidate.holdingOfferCompany && <div className="flex items-center justify-between"><span className="text-slate-500">Company</span><span className="font-medium text-slate-800">{candidate.holdingOfferCompany}</span></div>}
                      {candidate.holdingOfferDoj && <div className="flex items-center justify-between"><span className="text-slate-500">DoJ</span><span className="font-medium text-slate-800">{formatLongDate(candidate.holdingOfferDoj)}</span></div>}
                    </div>
                  </div>
                )}
                {/* Notes Card */}
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <span className="h-3 w-0.5 rounded-full bg-violet-400" /> Notes
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">{candidate.remarks || "No notes"}</p>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-xs text-slate-400">Submitted: {formatLongDate(candidate.submittedAt)}</span>
                  <span className="text-xs text-slate-400">ID: {candidate.id}</span>
                  <span className="text-xs text-slate-400">Source: {candidate.source || "—"}</span>
                </div>
              </div>
            </div>
          ) : (
            /* ▸▸▸ EDIT MODE ▸▸▸ */
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-violet-400" /> Contact &amp; Source</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className={lc}>Candidate Name</div><input className={`mt-1 ${ic}`} value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div><div className={lc}>Requisition ID</div><input className={`mt-1 ${ic}`} value={requisitionId} onChange={(e) => setRequisitionId(e.target.value)} /></div>
                  <div><div className={lc}>Contact No</div><input className={`mt-1 ${ic}`} value={contactNo} onChange={(e) => setContactNo(e.target.value)} /></div>
                  <div><div className={lc}>Email ID</div><input className={`mt-1 ${ic}`} type="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} /></div>
                  <div><div className={lc}>Stage</div>
                    <select className={`mt-1 ${ic}`} value={stage} onChange={(e) => setStage(e.target.value as CandidateStage)}>
                      <optgroup label="Active Pipeline">
                        <option value="CV Submitted">CV Submitted</option>
                        <option value="Interview">Interview</option>
                        <option value="Final Selection">Final Selection</option>
                        <option value="Offer">Offer</option>
                        <option value="Joined">Joined</option>
                      </optgroup>
                      <optgroup label="Terminal Status">
                        <option value="Screen Reject">Screen Reject</option>
                        <option value="Drop">Drop</option>
                        <option value="Duplicate">Duplicate</option>
                        <option value="Rejected">Rejected</option>
                      </optgroup>
                    </select>
                  </div>
                  <div><div className={lc}>Source</div><select className={`mt-1 ${ic}`} value={source} onChange={(e) => setSource(e.target.value)}>{CANDIDATE_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-violet-400" /> Position</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className={lc}>Position</div><select className={`mt-1 ${ic}`} value={positionId} onChange={(e) => setPositionId(e.target.value)}>{state.positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                  <div><div className={lc}>Client</div><div className="mt-1 text-sm leading-relaxed text-slate-700">{client?.name || "—"}</div></div>
                  <div><div className={lc}>Client POC</div><div className="mt-1 text-sm leading-relaxed text-slate-700">{spoc?.name || "—"}</div></div>
                  <div><div className={lc}>Recruiter</div><div className="mt-1 text-sm leading-relaxed text-slate-700">{recruiter?.name || "—"}</div></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-violet-400" /> Compensation</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className={lc}>Current CTC (LPA)</div><input className={`mt-1 ${ic}`} type="number" min={0} step={0.5} value={currentCtc} onChange={(e) => setCurrentCtc(e.target.value)} /></div>
                  <div><div className={lc}>Expected CTC (LPA)</div><input className={`mt-1 ${ic}`} type="number" min={0} step={0.5} value={expectedCtc} onChange={(e) => setExpectedCtc(e.target.value)} /></div>
                  <div><div className={lc}>Notice Period</div><input className={`mt-1 ${ic}`} value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} /></div>
                  <div><div className={lc}>Current Company</div><input className={`mt-1 ${ic}`} value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} /></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-violet-400" /> Holding Offer</div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500" checked={hasHoldingOffer} onChange={(e) => setHasHoldingOffer(e.target.checked)} />
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
              </div>
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-violet-400" /> Profile</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className={lc}>Location</div><input className={`mt-1 ${ic}`} value={location} onChange={(e) => setLocation(e.target.value)} /></div>
                  <div><div className={lc}>Experience (Yrs)</div><input className={`mt-1 ${ic}`} type="number" min={0} step={0.5} value={experience} onChange={(e) => setExperience(e.target.value)} /></div>
                  <div><div className={lc}>Technology</div><input className={`mt-1 ${ic}`} value={technology} onChange={(e) => setTechnology(e.target.value)} /></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-violet-400" /> Notes</div>
                <textarea className={`w-full ${ic.replace("bg-white", "")} resize-none`} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Additional notes" />
              </div>
            </div>
          )}

    </DetailModalShell>
  );
}

export default function SubmissionsPage() {
  const { state, updateCandidateAll, currentRecruiterId, deleteCandidate } = useApp();
  const lookups = useMemo(() => createLookups(state), [state]);
  const [detailTarget, setDetailTarget] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [tab, setTab] = useState<"my" | "all">("my");
  const [clientFilter, setClientFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date()));
  const [quickActionTarget, setQuickActionTarget] = useState<{ candidate: Candidate; stage: CandidateStage } | null>(null);
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const monthOptions = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);
  const allCandidatesTotal = state.candidates.length;

  const filterOptions = useMemo(() => {
    const clients = new Map<string, string>();
    const recruiters = new Map<string, string>();
    const statuses = new Set<string>();
    for (const c of state.candidates) {
      if (c.clientId) clients.set(c.clientId, lookups.clients.get(c.clientId)?.name ?? c.clientId);
      if (c.recruiterId) recruiters.set(c.recruiterId, lookups.recruiters.get(c.recruiterId)?.name ?? c.recruiterId);
      if (c.stage) statuses.add(c.stage);
    }
    return { clients, recruiters, statuses };
  }, [state.candidates, lookups]);

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const searched = state.candidates.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.contactNo.toLowerCase().includes(q) ||
        c.emailId.toLowerCase().includes(q)
      );
      return searched.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    }
    let list = state.candidates;
    if (tab === "my") {
      list = list.filter((c) => c.recruiterId === currentRecruiterId);
      list = list.filter((c) => monthKey(c.submittedAt) === selectedMonth);
    }
    if (tab !== "my" && recruiterFilter) list = list.filter((c) => c.recruiterId === recruiterFilter);
    if (clientFilter) list = list.filter((c) => c.clientId === clientFilter);
    if (statusFilter) list = list.filter((c) => c.stage === statusFilter);
    list.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    return list;
  }, [state.candidates, tab, currentRecruiterId, recruiterFilter, clientFilter, statusFilter, searchQuery, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = useMemo(() => {
    return rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  }, [rows, safePage]);

  const handleQuickAction = (candidate: Candidate, newStage: CandidateStage) => {
    const payload = buildCandidatePayload(
      {
        name: candidate.name,
        contactNo: candidate.contactNo,
        emailId: candidate.emailId,
        source: candidate.source,
        remarks: candidate.remarks,
        technology: candidate.technology,
        currentCtc: candidate.currentCtc,
        expectedCtc: candidate.expectedCtc,
        noticePeriod: candidate.noticePeriod,
        currentCompany: candidate.currentCompany,
        experience: candidate.experience,
        location: candidate.location,
        requisitionId: candidate.requisitionId,
        stage: newStage,
        submittedAt: candidate.submittedAt,
        finalSelectDate: candidate.finalSelectDate,
        finalSelectStatus: candidate.finalSelectStatus,
        holdingOfferCtc: candidate.holdingOfferCtc,
        holdingOfferCompany: candidate.holdingOfferCompany,
        holdingOfferDoj: candidate.holdingOfferDoj,
      },
      lookups.positions.get(candidate.positionId)!,
      candidate.recruiterId
    );
    updateCandidateAll({ candidateId: candidate.id, candidate: payload });
    toast.success(`${candidate.name} marked as ${newStage}.`);
    setQuickActionTarget(null);
  };

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [tab, clientFilter, recruiterFilter, statusFilter, searchQuery, selectedMonth]);

  const detailCandidate = detailTarget ? lookups.candidates.get(detailTarget) : undefined;

  return (
    <SectionPageLayout
      title="Submissions"
      accent="violet"
      tabs={[
        { label: "My Submissions", value: "my" },
        { label: "All Submissions", value: "all" },
      ]}
      activeTab={tab}
      onTabChange={(v) => setTab(v as "my" | "all")}
      filters={
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              className="w-64 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 bg-white placeholder:text-slate-400"
              placeholder="Search by name, phone or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {tab === "my" && (
            <FilterSelect accent="violet" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </FilterSelect>
          )}
          <FilterSelect accent="violet" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {[...filterOptions.clients.entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </FilterSelect>
          {tab !== "my" && (
            <FilterSelect accent="violet" value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)}>
              <option value="">All Recruiters</option>
              {[...filterOptions.recruiters.entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </FilterSelect>
          )}
          <FilterSelect accent="violet" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {[...filterOptions.statuses].map((s) => <option key={s} value={s}>{s}</option>)}
          </FilterSelect>
        </>
      }
      action={
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Submission
        </Button>
      }
      count={rows.length}
      countLabel={tab === "my" ? `submissions in ${formatMonthLabel(selectedMonth)}` : `submissions (page ${safePage + 1} of ${totalPages})`}
    >
      <SectionTable
        headers={[
          { label: "Date" },
          { label: "Recruiter" },
          { label: "Client" },
          { label: "Position" },
          { label: "Candidate Name" },
          { label: "Status" },
          { label: "Actions", className: "w-20 text-center" },
        ]}
        accent="violet"
      >
        {pagedRows.map((candidate) => {
          const pos = lookups.positions.get(candidate.positionId);
          const client = lookups.clients.get(candidate.clientId);
          const rec = lookups.recruiters.get(candidate.recruiterId);
          const isOwn = candidate.recruiterId === currentRecruiterId;
          const isTerminal = TERMINAL_STAGES.includes(candidate.stage);

          return (
            <SectionRow key={candidate.id} accent="violet" onClick={() => setDetailTarget(candidate.id)}>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-600">{formatLongDate(candidate.submittedAt)}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">
                {rec?.name ?? "—"}
                {isOwn && <span className="ml-1.5 text-xs text-violet-500 font-medium">(You)</span>}
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{client?.name ?? "—"}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{pos?.name ?? "—"}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-slate-800">{candidate.name}</td>
              <td className="border-b border-slate-100 px-4 py-3.5">
                <StatusPill status={candidate.stage} />
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                {isOwn && !isTerminal && (
                  <div className="relative inline-block">
                    <button
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-violet-100 hover:text-violet-700 transition-colors"
                      onClick={(e) => { e.stopPropagation(); setOpenActionsFor(openActionsFor === candidate.id ? null : candidate.id); }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {openActionsFor === candidate.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenActionsFor(null)} />
                        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mark as</div>
                          {TERMINAL_STAGES.map((stage) => (
                            <button
                              key={stage}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              onClick={(e) => { e.stopPropagation(); setOpenActionsFor(null); setQuickActionTarget({ candidate, stage }); }}
                            >
                              {stage}
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
        {pagedRows.length === 0 && <SectionEmpty colSpan={7} message="No submissions found" />}
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

      {/* Quick Action Confirmation Modal */}
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
              <Button size="sm" variant="destructive" onClick={() => handleQuickAction(quickActionTarget.candidate, quickActionTarget.stage)}>Confirm</Button>
            </>
          }
        >
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                Mark <strong className="text-slate-900">{quickActionTarget.candidate.name}</strong> as <strong className="text-slate-900">{quickActionTarget.stage}</strong>?
              </p>
              <p className="mt-1 text-xs text-slate-400">This will remove them from the active recruitment pipeline.</p>
            </div>
          </div>
        </ModalShell>
      )}

      {showAddModal && <AddSubmissionModal onClose={() => setShowAddModal(false)} />}
      {detailCandidate && (
        <DetailModal
          key={detailCandidate.id}
          candidate={detailCandidate}
          onClose={() => setDetailTarget(null)}
          onDelete={() => setDeleteTarget(detailCandidate.id)}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteCandidate(deleteTarget!); setDetailTarget(null); setDeleteTarget(null); }}
        itemName={lookups.candidates.get(deleteTarget ?? "")?.name ?? "this candidate"}
        itemType="candidate"
      />
    </SectionPageLayout>
  );
}
