import * as React from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function ModalShell({ open, onClose, title, accent = "slate", children, footer, className, size = "lg" }: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const barColor = accent === "amber" ? "bg-amber-500" : accent === "violet" ? "bg-violet-500" : accent === "blue" ? "bg-blue-500" : accent === "emerald" ? "bg-emerald-500" : accent === "teal" ? "bg-teal-500" : "bg-slate-500";

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className={cn("flex w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[85vh]", sizeStyles[size], className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
          <span className={cn("block h-5 w-1 shrink-0 rounded-full", barColor)} />
          <h2 className="flex-1 font-heading text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          <button
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-3", className)}>{children}</div>;
}

export function ModalCancelButton({ onClick, label = "Cancel" }: { onClick: () => void; label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}

export function ModalDeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="destructive" size="sm" onClick={onClick}>
      Delete
    </Button>
  );
}
