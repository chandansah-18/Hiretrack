"use client";

import { useMemo } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useApp } from "@/components/providers/app-provider";
import { getDataMonths } from "@/lib/data/selectors";
import { formatMonthLabel } from "@/lib/utils";

export function FilterBar() {
  const { state, filters, setFilters, resetFilters } = useApp();
  const months = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);

  if (!state) {
    return null;
  }

  return (
    <div className="sticky top-0 z-30 border-b border-white/70 bg-[rgba(248,250,248,0.92)]/90 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-[1600px] gap-3 px-4 py-4 lg:grid-cols-[1.6fr_repeat(7,minmax(0,1fr))_auto]">
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search candidate, position, client, recruiter, SPOC, technology"
            value={filters.search}
            onChange={(event) => setFilters({ search: event.target.value })}
          />
        </div>

        <Select value={filters.clientId} onChange={(event) => setFilters({ clientId: event.target.value })}>
          <option value="">All clients</option>
          {state.clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>

        <Select value={filters.recruiterId} onChange={(event) => setFilters({ recruiterId: event.target.value })}>
          <option value="">All recruiters</option>
          {state.recruiters.map((recruiter) => (
            <option key={recruiter.id} value={recruiter.id}>
              {recruiter.name}
            </option>
          ))}
        </Select>

        <Select value={filters.vertical} onChange={(event) => setFilters({ vertical: event.target.value })}>
          <option value="">All verticals</option>
          {Array.from(new Set(state.recruiters.map((recruiter) => recruiter.vertical))).map((vertical) => (
            <option key={vertical} value={vertical}>
              {vertical}
            </option>
          ))}
        </Select>

        <Select value={filters.spocId} onChange={(event) => setFilters({ spocId: event.target.value })}>
          <option value="">All SPOCs</option>
          {state.spocs.map((spoc) => (
            <option key={spoc.id} value={spoc.id}>
              {spoc.name}
            </option>
          ))}
        </Select>

        <Select value={filters.positionId} onChange={(event) => setFilters({ positionId: event.target.value })}>
          <option value="">All positions</option>
          {state.positions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.name}
            </option>
          ))}
        </Select>

        <Select value={filters.status} onChange={(event) => setFilters({ status: event.target.value })}>
          <option value="">All status</option>
          <option value="Open">Open</option>
          <option value="On Hold">On Hold</option>
          <option value="Closed">Closed</option>
          <option value="Filled">Filled</option>
          <option value="L1 Scheduled">L1 Scheduled</option>
          <option value="L2 Scheduled">L2 Scheduled</option>
          <option value="L3 Scheduled">L3 Scheduled</option>
          <option value="L1 Done">L1 Done</option>
          <option value="L2 Done">L2 Done</option>
          <option value="L3 Done">L3 Done</option>
          <option value="CI Round Done">CI Round Done</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Sent">Sent</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
          <option value="Joined">Joined</option>
        </Select>

        <Select
          value={filters.fromDate}
          onChange={(event) =>
            setFilters({
              fromDate: event.target.value,
            })
          }
        >
          <option value="">From date</option>
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.toDate}
          onChange={(event) =>
            setFilters({
              toDate: event.target.value,
            })
          }
        >
          <option value="">To date</option>
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </Select>

        <Button variant="outline" className="justify-center" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
