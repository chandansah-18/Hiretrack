import * as React from "react";
import { cn } from "@/lib/utils";

type PanelVariant = "frosted" | "solid" | "elevated";

const variantStyles: Record<PanelVariant, string> = {
  frosted: "rounded-[28px] border border-white/80 bg-white/90 shadow-[0_20px_70px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
  solid: "rounded-xl border border-slate-200 bg-white shadow-sm",
  elevated: "rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)]",
};

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
}

export function Panel({ className, variant = "frosted", ...props }: PanelProps) {
  return <div className={cn("min-w-0", variantStyles[variant], className)} {...props} />;
}

export function PanelHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 px-6 py-4", className)} {...props} />;
}

export function PanelTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("min-w-0 break-words text-base font-semibold tracking-tight text-slate-950", className)} {...props} />;
}

export function PanelContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 px-6 py-5", className)} {...props} />;
}

export function SectionCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("min-w-0 rounded-xl border border-slate-100 bg-white p-4", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionCardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionCardRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 text-sm", className)}>
      <span className="min-w-0 break-words text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-slate-800">{value ?? "\u2014"}</span>
    </div>
  );
}
