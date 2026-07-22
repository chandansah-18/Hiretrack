"use client";

import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/panel";

const accentMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", icon: "text-blue-500", bar: "bg-blue-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500", bar: "bg-emerald-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", icon: "text-amber-500", bar: "bg-amber-500" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", icon: "text-violet-500", bar: "bg-violet-500" },
};

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  delta?: number;
  icon?: LucideIcon;
  accent?: "blue" | "emerald" | "amber" | "violet";
}) {
  const colors = accentMap[accent];
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;
  const DeltaIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const deltaColor = isPositive ? "text-emerald-600" : isNegative ? "text-red-500" : "text-slate-400";

  return (
    <Panel variant="elevated" className={cn("relative overflow-hidden p-5")}>
      <div className={cn("absolute inset-x-0 top-0 h-0.5", colors.bar)} />
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 break-words text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-2", colors.bg)}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <DeltaIcon className={cn("h-3.5 w-3.5", deltaColor)} />
          <span className={cn("text-xs font-medium", deltaColor)}>
            {isPositive ? "+" : ""}{delta}% vs last month
          </span>
        </div>
      )}
    </Panel>
  );
}
