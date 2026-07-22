import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn("px-6 py-6", className)}>
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">{eyebrow}</p> : null}
        <h3 className="font-heading text-2xl font-semibold tracking-tight text-slate-950">{title}</h3>
        <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3 mt-4">{actions}</div> : null}
    </Panel>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{children}</p>;
}

export function SectionAction({ children }: { children: ReactNode }) {
  return <Button variant="outline">{children}</Button>;
}
