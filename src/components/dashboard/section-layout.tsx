"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type AccentColor = "blue" | "violet" | "amber" | "emerald" | "teal";

const accentMap: Record<
  AccentColor,
  Record<string, string>
> = {
  blue: { ring: "focus:border-blue-500", text: "text-blue-600", border: "border-blue-200", hover: "hover:bg-blue-50", light: "bg-blue-50", active: "bg-blue-600 text-white", badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  violet: { ring: "focus:border-violet-500", text: "text-violet-600", border: "border-violet-200", hover: "hover:bg-violet-50", light: "bg-violet-50", active: "bg-violet-600 text-white", badge: "bg-violet-100 text-violet-800", dot: "bg-violet-500" },
  amber: { ring: "focus:border-amber-500", text: "text-amber-600", border: "border-amber-200", hover: "hover:bg-amber-50", light: "bg-amber-50", active: "bg-amber-600 text-white", badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  emerald: { ring: "focus:border-emerald-500", text: "text-emerald-600", border: "border-emerald-200", hover: "hover:bg-emerald-50", light: "bg-emerald-50", active: "bg-emerald-600 text-white", badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  teal: { ring: "focus:border-teal-500", text: "text-teal-600", border: "border-teal-200", hover: "hover:bg-teal-50", light: "bg-teal-50", active: "bg-teal-600 text-white", badge: "bg-teal-100 text-teal-800", dot: "bg-teal-500" },
};

interface Tab { label: string; value: string; }

export function SectionPageLayout({
  title,
  accent,
  tabs,
  activeTab,
  onTabChange,
  filters,
  action,
  count,
  countLabel,
  children,
  eyebrow,
  description,
}: {
  title: string;
  accent: AccentColor;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  filters?: ReactNode;
  action?: ReactNode;
  count: number;
  countLabel: string;
  children: ReactNode;
  eyebrow?: string;
  description?: string;
}) {
  const ac = accentMap[accent];

  return (
    <Panel variant="elevated" className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className={cn("block h-5 w-1 rounded-full", ac.dot)} />
            <div>
              {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{eyebrow}</p>}
              <h1 className="font-heading text-base font-semibold tracking-tight text-slate-900">{title}</h1>
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
          {filters && <div className="flex items-center gap-2">{filters}</div>}
        </div>
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange && (
        <div className="border-b border-slate-100 px-6 py-2">
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Info bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
        <span className="text-xs font-medium tracking-wide text-slate-400">
          {count} {countLabel}
        </span>
        {action && <div>{action}</div>}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto scroll-smooth">{children}</div>
    </Panel>
  );
}

export function SectionTable({
  headers,
  children,
  accent,
  colSpan,
}: {
  headers: { label: string; className?: string }[];
  children: ReactNode;
  accent: AccentColor;
  colSpan?: number;
}) {
  const ac = accentMap[accent];

  return (
    <table className="w-full border-collapse text-sm leading-relaxed text-justify">
      <thead>
        <tr className={cn("sticky top-0 z-10 text-justify font-heading text-xs font-semibold uppercase tracking-wider leading-relaxed", ac.light, ac.text)}>
          {headers.map((h, i) => (
            <th key={i} className={cn("border-b border-slate-200/80 px-4 py-3.5", h.className)}>
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function SectionRow({
  children,
  onClick,
  accent,
}: {
  children: ReactNode;
  onClick?: () => void;
  accent?: AccentColor;
}) {
  const ac = accent ? accentMap[accent] : null;

  return (
    <tr
      className={cn(
        "transition-colors duration-150",
        ac ? cn(ac.hover) : "hover:bg-slate-50",
        "even:bg-white odd:bg-slate-50/40"
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function SectionEmpty({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-slate-400">
        {message}
      </td>
    </tr>
  );
}
