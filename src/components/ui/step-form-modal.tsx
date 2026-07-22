import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ModalShell, ModalShellProps } from "./modal-shell";

export interface StepFormModalProps extends Omit<ModalShellProps, "children" | "footer"> {
  steps: string[];
  currentStep: number;
  onStepChange: (step: number) => void;
  canNext: boolean;
  isValid?: boolean;
  onCancel?: () => void;
  onSubmit?: () => void;
  isEditing?: boolean;
  saving?: boolean;
  children: React.ReactNode;
  submitLabel?: string;
  editingLabel?: string;
  accent?: string;
}

export function StepFormModal({
  steps,
  currentStep,
  onStepChange,
  canNext,
  isValid = true,
  onCancel,
  onSubmit,
  isEditing,
  saving,
  children,
  submitLabel = "Submit",
  editingLabel = "Update",
  accent = "slate",
  ...modalProps
}: StepFormModalProps) {
  const totalSteps = steps.length;
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const activeColor = accent === "amber" ? "bg-amber-600 text-white shadow-sm" : accent === "violet" ? "bg-violet-600 text-white shadow-sm" : accent === "blue" ? "bg-blue-600 text-white shadow-sm" : accent === "emerald" ? "bg-emerald-600 text-white shadow-sm" : accent === "teal" ? "bg-teal-600 text-white shadow-sm" : "bg-slate-600 text-white shadow-sm";

  const doneColor = accent === "amber" ? "bg-amber-100 text-amber-700" : accent === "violet" ? "bg-violet-100 text-violet-700" : accent === "blue" ? "bg-blue-100 text-blue-700" : accent === "emerald" ? "bg-emerald-100 text-emerald-700" : accent === "teal" ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-700";

  const activeTextColor = accent === "amber" ? "text-amber-700" : accent === "violet" ? "text-violet-700" : accent === "blue" ? "text-blue-700" : accent === "emerald" ? "text-emerald-700" : accent === "teal" ? "text-teal-700" : "text-slate-700";

  const doneLineColor = accent === "amber" ? "bg-amber-300" : accent === "violet" ? "bg-violet-300" : accent === "blue" ? "bg-blue-300" : accent === "emerald" ? "bg-emerald-300" : accent === "teal" ? "bg-teal-300" : "bg-slate-300";

  const stepIndicator = (
    <div className="flex items-center justify-center gap-1 border-b border-slate-100 px-6 py-3">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < currentStep;
        const active = num === currentStep;
        return (
          <div key={i} className="flex items-center gap-1">
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                active ? activeColor : done ? doneColor : "bg-slate-100 text-slate-400"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : num}
            </div>
            <span className={cn("text-[11px] font-medium leading-none", active ? activeTextColor : "text-slate-400")}>
              {label}
            </span>
            {i < steps.length - 1 && <div className={cn("mx-1 h-px w-5", done ? doneLineColor : "bg-slate-200")} />}
          </div>
        );
      })}
    </div>
  );

  const footerLeft = !isFirstStep ? (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onStepChange(currentStep - 1)}>
      <ChevronLeft className="h-3.5 w-3.5" /> Back
    </Button>
  ) : (
    <div />
  );

  const footerRight = !isLastStep ? (
    <Button size="sm" className="gap-1.5" onClick={() => onStepChange(currentStep + 1)} disabled={!canNext}>
      Next <ChevronRight className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <div className="flex items-center gap-3">
      {onCancel && (
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      )}
      <Button size="sm" disabled={!isValid || saving} onClick={onSubmit}>
        {saving ? "Saving..." : isEditing ? editingLabel : submitLabel}
      </Button>
    </div>
  );

  return (
    <ModalShell {...modalProps} accent={accent} footer={null}>
      {stepIndicator}
      {children}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
        {footerLeft}
        {footerRight}
      </div>
    </ModalShell>
  );
}
