"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Pencil, Plus, Search, Trash2, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { StepFormModal } from "@/components/ui/step-form-modal";
import { ConfirmDeleteModal } from "@/components/ui/confirm-delete-modal";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  SectionPageLayout,
  SectionTable,
  SectionRow,
  SectionEmpty,
} from "@/components/dashboard/section-layout";
import { useApp } from "@/components/providers/app-provider";
import { createLookups } from "@/lib/data/selectors";
import type { Position, PositionStatus } from "@/lib/data/types";
import { formatLongDate } from "@/lib/utils";
import { SectionDownload } from "@/components/dashboard/section-download";

const MAJOR_CITIES = [
  "Bangalore", "Hyderabad", "Pune", "Mumbai", "Chennai", "Delhi/NCR",
  "Kolkata", "Ahmedabad", "Kochi", "Trivandrum", "Coimbatore",
  "Indore", "Nagpur", "Chandigarh", "Jaipur", "Bhubaneswar",
];

const TABS = [
  { label: "Open", value: "Open" },
  { label: "Closed", value: "Closed" },
  { label: "Hold", value: "On Hold" },
];

function LocationCheckboxes({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const [otherText, setOtherText] = useState("");
  const hasOther = value.some((v) => !MAJOR_CITIES.includes(v));

  const toggle = (city: string) => {
    if (value.includes(city)) {
      onChange(value.filter((v) => v !== city));
    } else {
      onChange([...value, city]);
    }
  };

  const addOther = () => {
    if (otherText.trim() && !value.includes(otherText.trim())) {
      onChange([...value, otherText.trim()]);
      setOtherText("");
    }
  };

  const removeOther = (city: string) => {
    onChange(value.filter((v) => v !== city));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
        {MAJOR_CITIES.map((city) => (
          <label key={city} className="flex items-center gap-1.5 text-xs text-slate-700">
            <input type="checkbox" checked={value.includes(city)} onChange={() => toggle(city)} disabled={disabled} className="rounded border-slate-300 text-blue-600" />
            {city}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-slate-700">
          <input type="checkbox" checked={hasOther} onChange={() => { if (hasOther) { onChange(value.filter((v) => MAJOR_CITIES.includes(v))); } }} disabled={disabled} className="rounded border-slate-300 text-blue-600" />
          Other
        </label>
        {hasOther ? (
          <div className="flex flex-wrap gap-1">
            {value.filter((v) => !MAJOR_CITIES.includes(v)).map((city) => (
              <span key={city} className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                {city}
                {!disabled && <button onClick={() => removeOther(city)}><X className="h-2.5 w-2.5" /></button>}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input className="w-28 rounded border border-slate-300 px-2 py-0.5 text-[11px] outline-none focus:border-blue-500" placeholder="Type city..." value={otherText} onChange={(e) => setOtherText(e.target.value)} disabled={disabled} />
            <button className="rounded px-1.5 py-0.5 text-[11px] text-blue-600 hover:bg-blue-50 disabled:opacity-40" onClick={addOther} disabled={!otherText.trim() || disabled}>Add</button>
          </div>
        )}
      </div>
    </div>
  );
}

function PositionFormModal({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (data: Omit<Position, "id">) => void;
  initial?: Position;
}) {
  const { state } = useApp();
  const [form, setForm] = useState<Omit<Position, "id">>(() => ({
    name: initial?.name ?? "",
    clientId: initial?.clientId ?? "",
    recruiterId: initial?.recruiterId ?? "",
    spocId: initial?.spocId ?? "",
    vertical: initial?.vertical ?? "",
    technology: initial?.technology ?? "",
    status: initial?.status ?? "Open",
    openDate: initial?.openDate ?? new Date().toISOString().slice(0, 10),
    openings: initial?.openings ?? 1,
    ctc: initial?.ctc ?? 0,
    location: initial?.location ?? [],
    remarks: initial?.remarks ?? "",
  }));
  const [step, setStep] = useState(1);

  const isValid = form.name && form.clientId && form.spocId && form.recruiterId;
  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white";
  const lc = "text-xs font-semibold uppercase tracking-wider text-slate-500";
  const steps = ["Basic Info", "POCs & Compensation", "Review & Submit"];
  const canNext = step === 1 ? !!(form.name && form.clientId) : step === 2 ? !!(form.spocId && form.recruiterId) : true;

  return (
    <StepFormModal
      open={true}
      onClose={onClose}
      title={initial ? "Edit Position" : "Add Position"}
      accent="blue"
      size="xl"
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      canNext={canNext}
      isValid={!!isValid}
      onCancel={onClose}
      onSubmit={() => { onSave(form); onClose(); }}
      submitLabel={initial ? "Update" : "Submit"}
    >
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={lc}>Position Name *</label>
                <input className={`mt-1.5 ${ic}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Senior React Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc}>Client *</label>
                  <select className={`mt-1.5 ${ic}`} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, spocId: "" })}>
                    <option value="">Select client</option>
                    {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>Status</label>
                  <select className={`mt-1.5 ${ic}`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PositionStatus })}>
                    <option value="Open">Open</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Closed">Closed</option>
                    <option value="Filled">Filled</option>
                  </select>
                </div>
                <div>
                  <label className={lc}>Openings</label>
                  <input type="number" min={1} className={`mt-1.5 ${ic}`} value={form.openings} onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })} />
                </div>
                <div>
                  <label className={lc}>Date Added</label>
                  <input type="date" className={`mt-1.5 ${ic}`} value={form.openDate} onChange={(e) => setForm({ ...form, openDate: e.target.value })} />
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc}>Client POC *</label>
                  <select className={`mt-1.5 ${ic}`} value={form.spocId} onChange={(e) => setForm({ ...form, spocId: e.target.value })}>
                    <option value="">Select POC</option>
                    {state.spocs.filter((s) => s.clientId === form.clientId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>H&B SPOC *</label>
                  <select className={`mt-1.5 ${ic}`} value={form.recruiterId} onChange={(e) => setForm({ ...form, recruiterId: e.target.value })}>
                    <option value="">Select recruiter</option>
                    {state.recruiters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lc}>CTC (Lacs)</label>
                  <input type="number" min={0} step={0.5} className={`mt-1.5 ${ic}`} value={form.ctc} onChange={(e) => setForm({ ...form, ctc: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className={lc}>Locations</label>
                <div className="mt-1.5"><LocationCheckboxes value={form.location} onChange={(loc) => setForm({ ...form, location: loc })} /></div>
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
                  {[["Position Name", form.name],["Client", state.clients.find((c) => c.id === form.clientId)?.name ?? "—"],["Status", form.status],["Openings", String(form.openings)],["Date Added", form.openDate],["Client POC", state.spocs.find((s) => s.id === form.spocId)?.name ?? "—"],["H&B SPOC", state.recruiters.find((r) => r.id === form.recruiterId)?.name ?? "—"],["CTC", form.ctc ? `${form.ctc} Lacs` : "—"],["Locations", form.location.length ? form.location.join(", ") : "—"]].map(([l, v]) => (
                    <div key={l} className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-500">{l}</span><span className="font-medium text-slate-800">{v}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <label className={lc}>Remarks</label>
                <textarea className={`mt-1.5 ${ic} resize-none`} rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Add remarks..." />
              </div>
            </div>
          )}
    </StepFormModal>
  );
}

function DetailModal({
  position,
  onClose,
  onDelete,
}: {
  position: Position;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { state, updatePositionAll, currentRecruiterId } = useApp();
  const lookups = useMemo(() => createLookups(state), [state]);
  const ticketSize = position.ctc * 8.33 / 100;
  const submissionCount = state.candidates.filter((c) => c.positionId === position.id).length;
  const interviewCount = state.interviews.filter((i) => i.positionId === position.id).length;
  const finalCount = state.candidates.filter((c) => c.positionId === position.id && c.stage === "Final Selection").length;

  const canChangeStatus = state.currentUserRole === "admin" || state.currentUserRole === "manager" || currentRecruiterId === position.recruiterId;

  const [name, setName] = useState(position.name);
  const [clientId, setClientId] = useState(position.clientId);
  const [spocId, setSpocId] = useState(position.spocId);
  const [recruiterId, setRecruiterId] = useState(position.recruiterId);
  const [openDate, setOpenDate] = useState(position.openDate);
  const [openings, setOpenings] = useState(String(position.openings));
  const [ctc, setCtc] = useState(String(position.ctc));
  const [status, setStatus] = useState<PositionStatus>(position.status);
  const [remarks, setRemarks] = useState(position.remarks);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const client = lookups.clients.get(clientId);
  const spoc = lookups.spocs.get(spocId);
  const recruiter = lookups.recruiters.get(recruiterId);

  const hasChanges =
    name !== position.name ||
    clientId !== position.clientId ||
    spocId !== position.spocId ||
    recruiterId !== position.recruiterId ||
    openDate !== position.openDate ||
    String(openings) !== String(position.openings) ||
    String(ctc) !== String(position.ctc) ||
    status !== position.status ||
    remarks !== position.remarks;

  const handleSave = () => {
    setSaving(true);
    updatePositionAll({
      positionId: position.id,
      position: {
        ...position,
        name,
        clientId,
        spocId,
        recruiterId,
        openDate,
        openings: Number(openings) || 1,
        ctc: Number(ctc) || 0,
        status,
        remarks,
      },
    });
    setTimeout(() => setSaving(false), 300);
  };

  const initials = position.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const ic = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white";
  const lc = "text-xs font-semibold uppercase tracking-wider text-slate-500";
  const maxCv = Math.max(submissionCount, interviewCount, finalCount, 1);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="flex w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="block h-5 w-1 shrink-0 rounded-full bg-blue-500" />
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700 shadow-sm ring-2 ring-blue-200">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <input className="truncate font-heading text-lg font-bold tracking-tight text-slate-900 bg-transparent border-b border-transparent outline-none focus:border-blue-500 transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
                  ) : (
                    <h2 className="truncate font-heading text-lg font-bold tracking-tight text-slate-900">{name}</h2>
                  )}
                  {canChangeStatus ? (
                    <select className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white" value={status} onChange={(e) => setStatus(e.target.value as PositionStatus)}>
                      <option value="Open">Open</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Closed">Closed</option>
                      <option value="Filled">Filled</option>
                    </select>
                  ) : (
                    <StatusPill status={status} />
                  )}
                  <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Ticket</span>
                    <span className="text-sm font-bold text-emerald-800">{ticketSize.toFixed(1)}L</span>
                  </div>
                  {isEditing && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Editing</span>}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {client?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(state.currentUserRole === "admin" || state.currentUserRole === "manager") && !isEditing && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              <button className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!isEditing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                {/* Left column */}
                <div className="space-y-4">
                  {/* Position Details Card */}
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span className="h-3 w-0.5 rounded-full bg-blue-400" /> Position Details
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-500">Openings</span><span className="font-medium text-slate-800">{position.openings}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500">CTC</span><span className="font-medium text-slate-800">{position.ctc} Lacs</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500">Date Added</span><span className="font-medium text-slate-800">{formatLongDate(position.openDate)}</span></div>
                      {position.location.length > 0 && (
                        <div className="flex items-start justify-between gap-2"><span className="text-slate-500 shrink-0">Locations</span><span className="font-medium text-slate-800 text-right">{position.location.join(", ")}</span></div>
                      )}
                    </div>
                  </div>

                  {/* POCs Card */}
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span className="h-3 w-0.5 rounded-full bg-blue-400" /> Points of Contact
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-500">Client POC</span><span className="font-medium text-slate-800">{spoc?.name ?? "—"}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500">H&B SPOC</span><span className="font-medium text-slate-800">{recruiter?.name ?? "—"}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500">Client</span><span className="font-medium text-slate-800">{client?.name ?? "—"}</span></div>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {/* Pipeline Stats Card */}
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span className="h-3 w-0.5 rounded-full bg-blue-400" /> Pipeline Stats
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">CVs</span><span className="font-medium text-slate-800">{submissionCount}</span></div>
                        <div className="h-2 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min((submissionCount / maxCv) * 100, 100)}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Interviewed</span><span className="font-medium text-slate-800">{interviewCount}</span></div>
                        <div className="h-2 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min((interviewCount / maxCv) * 100, 100)}%` }} /></div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Final Sel.</span><span className="font-medium text-slate-800">{finalCount}</span></div>
                        <div className="h-2 w-full rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min((finalCount / maxCv) * 100, 100)}%` }} /></div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Card */}
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span className="h-3 w-0.5 rounded-full bg-blue-400" /> Notes
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">{remarks || "No notes"}</p>
                  </div>
                </div>
              </div>

              {/* Full-width metadata bar */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-xs text-slate-400">Added: {formatLongDate(position.openDate)}</span>
                <span className="text-xs text-slate-400">ID: {position.id}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-blue-400" /> Position Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className={lc}>Openings</div><input className={`mt-1 ${ic}`} type="number" value={openings} onChange={(e) => setOpenings(e.target.value)} /></div>
                  <div><div className={lc}>CTC (Lacs)</div><input className={`mt-1 ${ic}`} type="number" value={ctc} onChange={(e) => setCtc(e.target.value)} /></div>
                  <div><div className={lc}>Date Added</div><input className={`mt-1 ${ic}`} type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} /></div>
                  <div><div className={lc}>Position Name</div><input className={`mt-1 ${ic}`} value={name} onChange={(e) => setName(e.target.value)} /></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-blue-400" /> Points of Contact</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className={lc}>Client POC</div><select className={`mt-1 ${ic}`} value={spocId} onChange={(e) => setSpocId(e.target.value)}>{state.spocs.filter((s) => s.clientId === clientId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  <div><div className={lc}>H&B SPOC</div><select className={`mt-1 ${ic}`} value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)}>{state.recruiters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                  <div><div className={lc}>Client</div><select className={`mt-1 ${ic}`} value={clientId} onChange={(e) => { setClientId(e.target.value); setSpocId(""); }}>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100/80 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><span className="h-3 w-0.5 rounded-full bg-blue-400" /> Status &amp; Notes</div>
                <div className="space-y-3">
                  <div><div className={lc}>Status</div><select className={`mt-1 ${ic}`} value={status} onChange={(e) => setStatus(e.target.value as PositionStatus)}><option value="Open">Open</option><option value="On Hold">On Hold</option><option value="Closed">Closed</option><option value="Filled">Filled</option></select></div>
                  <div><div className={lc}>Remarks</div><textarea className={`mt-1 ${ic} resize-none`} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks..." /></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          {isEditing ? (
            <>
              {state.currentUserRole === "admin" && (
                <Button variant="destructive" size="sm" className="mr-auto gap-1.5" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}



export default function PositionsPage() {
  const { state, addPosition, deletePosition, can } = useApp();
  const [activeTab, setActiveTab] = useState("Open");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Position | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [clientFilter, setClientFilter] = useState("");
  const [pocFilter, setPocFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const lookups = useMemo(() => createLookups(state), [state]);

  const filtered = useMemo(() => {
    if (!state) return [];
    let rows = state.positions;
    if (activeTab !== "All") {
      rows = rows.filter((p) => p.status === activeTab);
    }
    if (clientFilter) {
      rows = rows.filter((p) => p.clientId === clientFilter);
    }
    if (pocFilter) {
      rows = rows.filter((p) => p.spocId === pocFilter);
    }
    if (monthFilter) {
      rows = rows.filter((p) => p.openDate.startsWith(monthFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter((p) => {
        const client = lookups.clients.get(p.clientId);
        const spoc = lookups.spocs.get(p.spocId);
        const recruiter = lookups.recruiters.get(p.recruiterId);
        return [p.name, client?.name, spoc?.name, recruiter?.name, p.status, p.openDate].some(
          (v) => `${v ?? ""}`.toLowerCase().includes(q)
        );
      });
    }
    return rows;
  }, [state, activeTab, clientFilter, pocFilter, monthFilter, searchQuery, lookups]);

  const downloadable = useMemo(() => {
    if (!filtered.length) return [];
    return filtered.map((p) => {
      const client = lookups.clients.get(p.clientId);
      const spoc = lookups.spocs.get(p.spocId);
      const recruiter = lookups.recruiters.get(p.recruiterId);

      return {
        interviewDate: p.openDate,
        clientName: client?.name,
        name: p.name,
        spocName: spoc?.name,
        recruiterName: recruiter?.name,
        status: p.status,
      };
    });
  }, [filtered, lookups]);

  const months = useMemo(() => {
    if (!state) return [];
    const set = new Set(state.positions.map((p) => p.openDate.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [state]);

  if (!state) return null;

  return (
    <SectionPageLayout
      title="Position"
      accent="blue"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(v) => setActiveTab(v)}
      filters={
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              className="w-44 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white placeholder:text-slate-400"
              placeholder="Search positions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <FilterSelect accent="blue" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All Clients</option>
            {state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>
          <FilterSelect accent="blue" value={pocFilter} onChange={(e) => setPocFilter(e.target.value)}>
            <option value="">All POCs</option>
            {state.spocs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FilterSelect>
          <FilterSelect accent="blue" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">All Months</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </FilterSelect>
        </>
        }
        action={
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Position
            </Button>
            <SectionDownload
              data={downloadable}
              filename={`positions-${activeTab}-${formatLongDate(new Date().toISOString())}.xlsx`}
              sheetName="Positions"
              columns={[
                { header: "Date", accessor: "openDate", width: 12 },
                { header: "Client", accessor: "clientName", width: 15 },
                { header: "Position", accessor: "name", width: 25 },
                { header: "Client POC", accessor: "spocName", width: 15 },
                { header: "H&B POC", accessor: "recruiterName", width: 15 },
                { header: "Status", accessor: "status", width: 12 },
              ]}
              filters={{
                clientFilter,
                statusFilter: activeTab,
              }}
              compact={true}
            />
          </div>
        }
        count={filtered.length}
        countLabel="positions"
    >
      <SectionTable
        headers={[
          { label: "Date" },
          { label: "Client" },
          { label: "Position" },
          { label: "Client POC" },
          { label: "H&B SPOC" },
          { label: "Status" },
        ]}
        accent="blue"
      >
        {filtered.map((position) => {
          const client = lookups.clients.get(position.clientId);
          const spoc = lookups.spocs.get(position.spocId);
          const recruiter = lookups.recruiters.get(position.recruiterId);

          return (
            <SectionRow key={position.id} accent="blue">
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-600">{formatLongDate(position.openDate)}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 font-semibold text-slate-800">{client?.name}</td>
              <td className="border-b border-slate-100 px-4 py-3.5">
                <button className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors" onClick={() => setDetailTarget(position)}>
                  {position.name}
                </button>
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{spoc?.name}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{recruiter?.name}</td>
              <td className="border-b border-slate-100 px-4 py-3.5"><StatusPill status={position.status} /></td>
            </SectionRow>
          );
        })}
        {filtered.length === 0 && <SectionEmpty colSpan={6} message="No positions found" />}
      </SectionTable>

      {/* Modals */}
      {addModalOpen && (
        <PositionFormModal
          onClose={() => setAddModalOpen(false)}
          onSave={(data) => addPosition(data)}
        />
      )}
      {detailTarget && (
        <DetailModal
          key={detailTarget.id}
          position={detailTarget}
          onClose={() => setDetailTarget(null)}
          onDelete={() => { setDeleteTarget(detailTarget); setDetailTarget(null); }}
        />
      )}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name ?? ""}
        itemType="position"
        onConfirm={() => { if (deleteTarget) { deletePosition(deleteTarget.id); setDeleteTarget(null); } }}
      />
    </SectionPageLayout>
  );
}
