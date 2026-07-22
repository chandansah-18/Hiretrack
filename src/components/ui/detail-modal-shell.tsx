import * as React from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import type { AccentColor } from "@/components/dashboard/section-layout";

const barColorMap: Record<string, string> = {
  blue: "bg-blue-500", violet: "bg-violet-500", amber: "bg-amber-500",
  emerald: "bg-emerald-500", teal: "bg-teal-500", slate: "bg-slate-500",
};
const avatarBgMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 ring-blue-200", violet: "bg-violet-100 text-violet-700 ring-violet-200",
  amber: "bg-amber-100 text-amber-700 ring-amber-200", emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  teal: "bg-teal-100 text-teal-700 ring-teal-200", slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export interface DetailModalShellProps {
  open: boolean;
  onClose: () => void;
  accent: AccentColor;
  initials: string;
  title: string;
  subtitle?: string;
  statusBadge?: React.ReactNode;
  isEditing: boolean;
  onToggleEdit?: () => void;
  canEdit?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailModalShell({
  open, onClose, accent, initials, title, subtitle, statusBadge,
  isEditing, onToggleEdit, canEdit, children, footer,
}: DetailModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const barColor = barColorMap[accent] ?? barColorMap.slate;
  const avatarColor = avatarBgMap[accent] ?? avatarBgMap.slate;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className={cn("block h-5 w-1 shrink-0 rounded-full", barColor)} />
              <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold shadow-sm ring-2", avatarColor)}>
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="min-w-0 break-words font-heading text-xl font-bold tracking-tight text-slate-900">{title}</h2>
                  {isEditing ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Editing</span>
                  ) : statusBadge}
                </div>
                {subtitle && <p className="mt-0.5 break-words text-sm text-slate-500">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && !isEditing && onToggleEdit && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={onToggleEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              <button
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function DetailSectionCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-slate-100 bg-white p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function DetailSectionTitle({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400", className)} {...props}>
      {children}
    </div>
  );
}

export function DetailSectionRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 text-sm", className)}>
      <span className="min-w-0 break-words text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-slate-800">{value ?? "\u2014"}</span>
    </div>
  );
}
