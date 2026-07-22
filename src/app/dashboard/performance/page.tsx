"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { useApp } from "@/components/providers/app-provider";
import { createLeaderboard, getDataMonths } from "@/lib/data/selectors";
import { formatMonthLabel, monthKey } from "@/lib/utils";

export default function PerformancePage() {
  const { state, activeFilters } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));

  if (!state) {
    return null;
  }

  const months = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);
  const leaderboard = createLeaderboard(state, activeFilters);
  const monthCandidates = state.candidates.filter((candidate) => monthKey(candidate.submittedAt) === selectedMonth);
  const monthInterviews = state.interviews.filter((interview) => monthKey(interview.interviewDate) === selectedMonth);
  const monthJoinings = state.joinings.filter((joining) => monthKey(joining.joiningDate) === selectedMonth);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Performance"
        title="Recruiter scorecard"
        description="A compact monthly score table for output, target, and joins."
        actions={
          <Select className="min-w-[180px]" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </Select>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Panel variant="solid" className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">CVs in month</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{monthCandidates.length}</p>
        </Panel>
        <Panel variant="solid" className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Interviews</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{monthInterviews.length}</p>
        </Panel>
        <Panel variant="solid" className="p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Joined</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{monthJoinings.filter((joining) => joining.status === "Joined").length}</p>
        </Panel>
      </div>

      <Panel variant="solid">
        <PanelHeader>
          <PanelTitle>Leaderboard</PanelTitle>
        </PanelHeader>
        <PanelContent>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[900px] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Recruiter</th>
                  <th className="px-4 py-3">CV</th>
                  <th className="px-4 py-3">Interviews</th>
                  <th className="px-4 py-3">Offers</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {leaderboard.map((recruiter) => (
                  <tr key={recruiter.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-950">{recruiter.name}</div>
                      <div className="text-xs text-slate-500">{recruiter.vertical}</div>
                    </td>
                    <td className="px-4 py-3">{recruiter.candidates}</td>
                    <td className="px-4 py-3">{recruiter.interviews}</td>
                    <td className="px-4 py-3">{recruiter.offers}</td>
                    <td className="px-4 py-3">{recruiter.joinings}</td>
                    <td className="px-4 py-3">{recruiter.target}</td>
                    <td className="px-4 py-3 font-medium text-slate-950">{recruiter.achievement}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelContent>
      </Panel>
    </div>
  );
}
