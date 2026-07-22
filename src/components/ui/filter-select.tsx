import * as React from "react";
import { cn } from "@/lib/utils";

export type AccentColor = "blue" | "violet" | "amber" | "emerald" | "teal" | "slate";

const focusRingMap: Record<AccentColor, string> = {
  blue: "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
  violet: "focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
  amber: "focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
  emerald: "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
  teal: "focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20",
  slate: "focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20",
};

export interface FilterSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  accent?: AccentColor;
}

export const FilterSelect = React.forwardRef<HTMLSelectElement, FilterSelectProps>(
  ({ className, accent = "slate", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none transition-colors bg-white",
          focusRingMap[accent],
          className
        )}
        {...props}
      />
    );
  }
);

FilterSelect.displayName = "FilterSelect";
