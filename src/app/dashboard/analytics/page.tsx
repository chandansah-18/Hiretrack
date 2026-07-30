"use client";

import { useState, useMemo, Fragment } from "react";
import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUp, Banknote, Building2, CalendarDays, ChevronDown, ChevronRight,
  Eye, Star, Target, TrendingUp, Trophy, UserCheck, X, XCircle,
} from "lucide-react";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MetricLineChart, MetricBarChart, MetricDonutChart } from "@/components/dashboard/charts";
import { useApp } from "@/components/providers/app-provider";
import {
  getCurrentMonthKey, getRevenueMetrics, getOfferLossMetrics, getClientRevenueBreakdown,
  getProductionPipeline, getClientAnalytics, getClientPocBreakdown,
  getWeeklyLeaderboard, getMonthlyLeaderboard,
  getQuarterOptions, getQuarterKey, getRevenueQuarterly,
  getWorstProductiveDay, getDailyCvReport, getRecruiterProfileDetail, getDataMonths,
} from "@/lib/data/selectors";
import { formatCurrency, formatShortDate, formatLongDate, monthKey, formatMonthLabel } from "@/lib/utils";
import type { DashboardState, DashboardFilters } from "@/lib/data/types";
import type { PocBreakdownRow } from "@/lib/data/selectors";

const TABS = [
  { key: "performance" as const, label: "Performance", icon: Trophy },
  { key: "revenue" as const, label: "Revenue", icon: Banknote },
  { key: "client" as const, label: "Client", icon: Building2 },
];

const chartPalette = ["#0f172a", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e", "#8b5cf6"];

function PerformanceTab(props: { state: DashboardState; activeFilters: DashboardFilters; selectedMonth: string }) {
  const { state, activeFilters, selectedMonth } = props;
  const weeklyLb = useMemo(() => getWeeklyLeaderboard(state), [state]);
  const monthlyLb = useMemo(() => getMonthlyLeaderboard(state, selectedMonth), [state, selectedMonth]);
  const days = useMemo(() => getWorstProductiveDay(state, selectedMonth), [state, selectedMonth]);
  const cvAvg = useMemo(() => {
    const totalCvs = monthlyLb.reduce((s, r) => s + r.cvCount, 0);
    const recruiterCount = monthlyLb.length;
    return recruiterCount > 1 ? Math.round(totalCvs / (recruiterCount - 1)) : 0;
  }, [monthlyLb]);
  const userRole = state.currentUserRole;
  const showProfiles = userRole === "admin" || userRole === "manager";
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [csrDate, setCsrDate] = useState(todayStr);
  const csrData = useMemo(() => getDailyCvReport(state, csrDate), [state, csrDate]);

  const [lbPeriod, setLbPeriod] = useState<"weekly" | "monthly">("weekly");
  const lbData = lbPeriod === "weekly" ? weeklyLb : monthlyLb;
  const maxCv = lbData.length > 0 ? Math.max(...lbData.map((r) => r.cvCount)) : 0;
  const csrTotal = csrData.reduce((s, r) => s + r.cvCount, 0);
  const periodAvg = useMemo(() => {
    const total = lbData.reduce((s, r) => s + r.cvCount, 0);
    const count = lbData.length;
    return count > 1 ? Math.round(total / (count - 1)) : 0;
  }, [lbData]);


  const RecruiterName = ({ name }: { name: string }) => (
    <span className="font-medium text-slate-900">{name}</span>
  );

  const ProfileButton = ({ recruiterId }: { recruiterId: string }) => {
    if (!showProfiles) return null;
    return (
      <Link
        href={`/dashboard/recruiter-profile?recruiterId=${recruiterId}`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors"
        title="View Profile"
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      {/* Row 1 — Leaderboard + Daily CSR */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* CV Leaderboard — redesigned with podium */}
        <Panel variant="frosted" className="md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-900">CV Leaderboard</span>
              {periodAvg > 0 && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  Avg: {periodAvg}/recruiter
                </span>
              )}
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                onClick={() => setLbPeriod("weekly")}
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold transition-all ${lbPeriod === "weekly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setLbPeriod("monthly")}
                className={`rounded-md px-2.5 py-0.5 text-[11px] font-semibold transition-all ${lbPeriod === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Monthly
              </button>
            </div>
          </div>

          {lbData.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400">No data {lbPeriod === "weekly" ? "this week" : "this month"}</div>
          ) : (
            <>
              {/* Podium — Top 3 */}
              {lbData.length >= 2 && (
                <div className="flex items-end justify-center gap-3 px-4 pt-4 pb-3">
                  {/* 2nd Place */}
                  <div className="flex w-[30%] flex-col items-center rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-3 pb-3 pt-4 shadow-sm">
                    <span className="text-lg">🥈</span>
                    <p className="mt-1 max-w-full truncate text-center text-[11px] font-bold text-slate-700">{lbData[1].name}</p>
                    <p className="text-lg font-bold text-slate-600">{lbData[1].cvCount}</p>
                  </div>
                  {/* 1st Place */}
                  <div className="-mt-2 flex w-[34%] flex-col items-center rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white px-3 pb-4 pt-5 shadow-md">
                    <span className="text-2xl">🥇</span>
                    <p className="mt-1 max-w-full truncate text-center text-xs font-bold text-amber-800">{lbData[0].name}</p>
                    <p className="text-xl font-bold text-amber-600">{lbData[0].cvCount}</p>
                  </div>
                  {/* 3rd Place */}
                  {lbData.length >= 3 && (
                    <div className="flex w-[30%] flex-col items-center rounded-xl border border-orange-200 bg-gradient-to-b from-orange-50 to-white px-3 pb-2 pt-4 shadow-sm">
                      <span className="text-lg">🥉</span>
                      <p className="mt-1 max-w-full truncate text-center text-[11px] font-bold text-orange-700">{lbData[2].name}</p>
                      <p className="text-lg font-bold text-orange-500">{lbData[2].cvCount}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Remaining Ranks — 4th onward */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="w-8 px-3 py-1.5">#</th>
                      <th className="px-3 py-1.5">Recruiter</th>
                      <th className="px-3 py-1.5 w-[25%]"></th>
                      <th className="px-3 py-1.5 text-right w-14">CVs</th>
                      <th className="w-8 px-2 py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lbData.slice(lbData.length >= 3 ? 3 : lbData.length >= 1 ? 1 : 0, 10).map((r, i) => {
                      const rank = lbData.length >= 3 ? i + 4 : i + 2;
                      return (
                        <tr key={r.recruiterId} className="group">
                          <td className="px-3 py-1.5 text-[11px] font-bold text-slate-300">{rank}</td>
                          <td className="px-3 py-1.5"><RecruiterName name={r.name} /></td>
                          <td className="px-3 py-1.5">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-300 transition-all"
                                style={{ width: `${maxCv > 0 ? (r.cvCount / maxCv) * 100 : 0}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-right font-bold text-slate-900">{r.cvCount}</td>
                          <td className="px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><ProfileButton recruiterId={r.recruiterId} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>

        {/* Daily CSR Report */}
        <Panel variant="frosted">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-bold text-slate-900">Daily CSR</span>
            </div>
            <input
              type="date"
              value={csrDate}
              onChange={(e) => setCsrDate(e.target.value)}
              className="h-7 rounded-md border border-slate-200 px-2 text-[11px] outline-none focus:border-blue-400"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-1.5">Recruiter</th>
                  <th className="px-3 py-1.5 text-right w-14">CVs</th>
                  <th className="w-8 px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {csrData.slice(0, 20).map((r) => (
                  <tr key={r.recruiterId} className="group">
                    <td className="px-3 py-1.5"><RecruiterName name={r.recruiterName} /></td>
                    <td className="px-3 py-1.5 text-right font-semibold text-slate-800">{r.cvCount}</td>
                    <td className="px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><ProfileButton recruiterId={r.recruiterId} /></td>
                  </tr>
                ))}
              </tbody>
              {csrData.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td className="px-3 py-1.5 text-[11px] font-bold text-slate-700">Total</td>
                    <td className="px-3 py-1.5 text-right text-[11px] font-bold text-slate-900">{csrTotal}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Panel>
      </div>

      {/* Row 2 — Day Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <PanelTitle className="flex items-center gap-2 text-xs">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              Most Productive Day
            </PanelTitle>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            {days.topCvCount > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white shadow">
                  {days.topCvCount}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{formatLongDate(days.topCvDay)}</p>
                  <p className="text-[11px] text-slate-500">{days.topCvCount} CV{days.topCvCount > 1 ? "s" : ""} submitted</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No CV submissions this month</p>
            )}
          </PanelContent>
        </Panel>
        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <PanelTitle className="flex items-center gap-2 text-xs">
              <ArrowDown className="h-3.5 w-3.5 text-red-400" />
              Least Productive Day
            </PanelTitle>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            {days.lowestCvCount > 0 && days.lowestCvDay !== "—" ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 text-sm font-bold text-white shadow">
                  {days.lowestCvCount}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{formatLongDate(days.lowestCvDay)}</p>
                  <p className="text-[11px] text-slate-500">{days.lowestCvCount} CV{days.lowestCvCount > 1 ? "s" : ""} submitted</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Not enough data</p>
            )}
          </PanelContent>
        </Panel>
        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <PanelTitle className="flex items-center gap-2 text-xs">
              <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
              Most Interviews in a Day
            </PanelTitle>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            {days.topInterviewCount > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white shadow">
                  {days.topInterviewCount}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{formatLongDate(days.topInterviewDay)}</p>
                  <p className="text-[11px] text-slate-500">{days.topInterviewCount} interview{days.topInterviewCount > 1 ? "s" : ""} conducted</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No interviews this month</p>
            )}
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}

function RevenueTab({ state, selectedMonth, onMonthChange }: { state: DashboardState; selectedMonth: string; onMonthChange: (m: string) => void }) {
  const metrics = useMemo(() => getRevenueMetrics(state, selectedMonth), [state, selectedMonth]);
  const pipeline = useMemo(() => getProductionPipeline(state), [state]);
  const losses = useMemo(() => getOfferLossMetrics(state, selectedMonth), [state, selectedMonth]);
  const clientRevenue = useMemo(() => getClientRevenueBreakdown(state, selectedMonth), [state, selectedMonth]);
  const quarters = useMemo(() => getQuarterOptions(), []);
  const currentQuarterKey = useMemo(() => getQuarterKey(new Date()), []);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarterKey);
  const quarterData = useMemo(() => getRevenueQuarterly(state, selectedQuarter), [state, selectedQuarter]);

  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${`${lastMonthDate.getMonth() + 1}`.padStart(2, "0")}`;
  const lastMonthMetrics = useMemo(() => getRevenueMetrics(state, lastMonthKey), [state, lastMonthKey]);

  const prevQuarterMonths = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return getQuarterKey(d);
  }, []);
  const prevQuarterData = useMemo(() => getRevenueQuarterly(state, prevQuarterMonths), [state, prevQuarterMonths]);

  const recruiterData = useMemo(() => {
    return getRecruiterProfileDetail(state, selectedMonth)
      .filter((r) => r.month.revenue > 0 || r.month.production > 0)
      .sort((a, b) => b.month.revenue - a.month.revenue);
  }, [state, selectedMonth]);

  const pipelineAging = useMemo(() => {
    const buckets = { urgent: 0, normal: 0, ahead: 0, far: 0 };
    pipeline.forEach((p) => {
      if (p.daysUntilJoining <= 7) buckets.urgent++;
      else if (p.daysUntilJoining <= 14) buckets.normal++;
      else if (p.daysUntilJoining <= 30) buckets.ahead++;
      else buckets.far++;
    });
    return [
      { name: "Urgent (≤7d)", value: buckets.urgent },
      { name: "Normal (8-14d)", value: buckets.normal },
      { name: "Ahead (15-30d)", value: buckets.ahead },
      { name: "Far (>30d)", value: buckets.far },
    ].filter((b) => b.value > 0);
  }, [pipeline]);

  const offerStats = useMemo(() => {
    const monthOffers = state.offers.filter((o) => o.offerDate && monthKey(o.offerDate) === selectedMonth);
    const accepted = monthOffers.filter((o) => o.selectionStatus === "Joined" || o.selectionStatus === "Joining Pending").length;
    const declined = monthOffers.filter((o) => o.selectionStatus === "Offer Declined").length;
    const total = accepted + declined;
    return { accepted, declined, total, rate: total > 0 ? Math.round((accepted / total) * 100) : 0 };
  }, [state, selectedMonth]);

  const trendData = useMemo(() => metrics.monthlyTrends.map((m) => ({
    name: m.label,
    Revenue: Math.round(m.revenue / 100000),
    Production: Math.round(m.production / 100000),
  })), [metrics.monthlyTrends]);

  const monthRevChange = lastMonthMetrics.currentMonthRevenue === 0 ? 0
    : Math.round(((metrics.currentMonthRevenue - lastMonthMetrics.currentMonthRevenue) / lastMonthMetrics.currentMonthRevenue) * 100);
  const monthProdChange = lastMonthMetrics.currentMonthProduction === 0 ? 0
    : Math.round(((metrics.currentMonthProduction - lastMonthMetrics.currentMonthProduction) / lastMonthMetrics.currentMonthProduction) * 100);
  const qtrRevChange = prevQuarterData.revenue === 0 ? 0
    : Math.round(((quarterData.revenue - prevQuarterData.revenue) / prevQuarterData.revenue) * 100);
  const qtrProdChange = prevQuarterData.production === 0 ? 0
    : Math.round(((quarterData.production - prevQuarterData.production) / prevQuarterData.production) * 100);

  const maxClientRev = Math.max(...clientRevenue.map((r) => r.revenue), 1);

  const renderChange = (value: number) => {
    if (value === 0) return <span className="text-xs text-slate-400">—</span>;
    const isUp = value > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-emerald-600" : "text-red-500"}`}>
        {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(value)}%
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Month Selector ── */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Month</span>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {getDataMonths(state).map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
          </select>
        </div>
      </div>

      {/* ── Section 1: KPI Snapshot ── */}
      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revenue (Month)</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">₹{formatCurrency(metrics.currentMonthRevenue)}</p>
          {renderChange(monthRevChange)}
        </div>
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Production (Month)</p>
          <p className="mt-1 text-xl font-bold text-blue-700">₹{formatCurrency(metrics.currentMonthProduction)}</p>
          {renderChange(monthProdChange)}
        </div>
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pre-Offer Lose</p>
          <p className="mt-1 text-xl font-bold text-red-600">{losses.preOfferLoseCount}</p>
          <p className="text-[10px] text-red-400">candidate{losses.preOfferLoseCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Post-Offer Lose</p>
          <p className="mt-1 text-xl font-bold text-orange-600">₹{formatCurrency(losses.postOfferLose)}</p>
          <p className="text-[10px] text-orange-400">{losses.postOfferLoseCount} offer{losses.postOfferLoseCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Pipeline Value</p>
          <p className="mt-1 text-xl font-bold text-violet-700">₹{formatCurrency(losses.totalPipelineValue)}</p>
          <p className="text-[10px] text-violet-400">{losses.pipelineCount} candidate{losses.pipelineCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* ── Pipeline Candidates (moved up) ── */}
      <Panel variant="solid">
        <PanelHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <PanelTitle className="flex items-center gap-2 text-xs">
              <Target className="h-3.5 w-3.5 text-amber-500" />
              Pipeline Candidates — Yet to Join
            </PanelTitle>
            <span className="text-xs text-slate-500">
              {losses.pipelineCount} candidate{losses.pipelineCount !== 1 ? "s" : ""} · Pipeline value: ₹{formatCurrency(losses.totalPipelineValue)}
            </span>
          </div>
        </PanelHeader>
        <PanelContent className="px-4 pb-4 pt-0">
          {pipeline.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No pending offers</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Candidate</th>
                    <th className="px-3 py-2">Client</th>
                    <th className="px-3 py-2">Position</th>
                    <th className="px-3 py-2 text-right">Offered CTC</th>
                    <th className="px-3 py-2 text-right">Bill Value</th>
                    <th className="px-3 py-2">Joining Date</th>
                    <th className="px-3 py-2 text-right w-20">Days Left</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {pipeline.map((row, i) => {
                    const days = row.daysUntilJoining;
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-900">{row.candidateName}</td>
                        <td className="px-3 py-2 text-slate-600">{row.clientName}</td>
                        <td className="px-3 py-2 text-slate-600">{row.positionName}</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">{row.offeredCtc} LPA</td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">₹{formatCurrency(row.billValue)}</td>
                        <td className="px-3 py-2 text-slate-600">{row.joiningDate ? formatShortDate(row.joiningDate) : "—"}</td>
                        <td className={`px-3 py-2 text-right font-semibold ${days > 0 ? "text-emerald-600" : days < 0 ? "text-red-500" : "text-slate-500"}`}>
                          {days > 0 ? `${days}d` : days < 0 ? `${Math.abs(days)}d` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            days < 0 ? "bg-red-50 text-red-600" : days <= 7 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {days < 0 ? "Overdue" : days <= 7 ? `${days}d left` : "Scheduled"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PanelContent>
      </Panel>

      {/* ── Comparison Cards ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <PanelTitle className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Month vs Previous Month
            </PanelTitle>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revenue</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">₹{formatCurrency(metrics.currentMonthRevenue)}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>Prev: ₹{formatCurrency(lastMonthMetrics.currentMonthRevenue)}</span>
                  {renderChange(monthRevChange)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Production</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">₹{formatCurrency(metrics.currentMonthProduction)}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>Prev: ₹{formatCurrency(lastMonthMetrics.currentMonthProduction)}</span>
                  {renderChange(monthProdChange)}
                </div>
              </div>
            </div>
          </PanelContent>
        </Panel>
        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <PanelTitle className="flex items-center gap-2 text-xs">
              <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
              {quarters.find((q) => q.value === selectedQuarter)?.label} vs Previous Quarter
            </PanelTitle>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revenue</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">₹{formatCurrency(quarterData.revenue)}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>Prev: ₹{formatCurrency(prevQuarterData.revenue)}</span>
                  {renderChange(qtrRevChange)}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Production</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900">₹{formatCurrency(quarterData.production)}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span>Prev: ₹{formatCurrency(prevQuarterData.production)}</span>
                  {renderChange(qtrProdChange)}
                </div>
              </div>
            </div>
          </PanelContent>
        </Panel>
      </div>

      {/* ── Revenue Deep Dive ── */}
      <Panel variant="solid">
        <PanelHeader className="px-4 py-3">
          <PanelTitle className="flex items-center gap-2 text-xs">
            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
            Recruiter Revenue — {formatMonthLabel(selectedMonth)}
          </PanelTitle>
        </PanelHeader>
        <PanelContent className="px-4 pb-4 pt-0">
          {recruiterData.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No revenue data for selected month</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="w-8 px-3 py-1.5">#</th>
                    <th className="px-3 py-1.5">Recruiter</th>
                    <th className="px-3 py-1.5 w-[30%]" />
                    <th className="px-3 py-1.5 text-right">Revenue</th>
                    <th className="px-3 py-1.5 text-right">Production</th>
                    <th className="px-3 py-1.5 text-right">Joined</th>
                    <th className="px-3 py-1.5 text-right w-14">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recruiterData.map((r, i) => {
                    const share = metrics.currentMonthRevenue > 0 ? Math.round((r.month.revenue / metrics.currentMonthRevenue) * 100) : 0;
                    const maxRevenue = recruiterData[0]?.month.revenue ?? 1;
                    return (
                      <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-1.5 text-[11px] font-bold text-slate-300">{i + 1}</td>
                        <td className="px-3 py-1.5">
                          <Link href={`/dashboard/recruiter-profile?id=${r.id}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">
                            {r.name}
                          </Link>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-blue-400 transition-all"
                              style={{ width: `${(r.month.revenue / maxRevenue) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold text-emerald-700">₹{formatCurrency(r.month.revenue)}</td>
                        <td className="px-3 py-1.5 text-right text-blue-700">₹{formatCurrency(r.month.production)}</td>
                        <td className="px-3 py-1.5 text-right font-semibold text-slate-800">{r.month.joinedCount}</td>
                        <td className="px-3 py-1.5 text-right">
                          <span className="text-[11px] font-semibold text-slate-600">{share}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </PanelContent>
      </Panel>

      {/* ── Pipeline Aging + Offer Acceptance ── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <PanelTitle className="flex items-center gap-2 text-xs">
              <Target className="h-3.5 w-3.5 text-amber-500" />
              Pipeline Aging
            </PanelTitle>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            {pipelineAging.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No pipeline candidates</p>
            ) : (
              <div className="space-y-3 py-2">
                {(() => {
                  const total = pipelineAging.reduce((s, b) => s + b.value, 0);
                  const colorMap: Record<string, { bar: string; bg: string; text: string }> = {
                    "Urgent (≤7d)": { bar: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
                    "Normal (8-14d)": { bar: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
                    "Ahead (15-30d)": { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
                    "Far (>30d)": { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
                  };
                  return pipelineAging.map((bucket) => {
                    const pct = Math.round((bucket.value / total) * 100);
                    const c = colorMap[bucket.name] ?? { bar: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-700" };
                    return (
                      <div key={bucket.name} className="flex items-center gap-3">
                        <div className={`w-14 shrink-0 rounded ${c.bg} px-2 py-1 text-center`}>
                          <span className={`text-[10px] font-bold ${c.text}`}>{pct}%</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] font-medium text-slate-700">{bucket.name}</span>
                            <span className="text-[11px] font-bold text-slate-900">{bucket.value}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </PanelContent>
        </Panel>

        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <PanelTitle className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Offer Acceptance
            </PanelTitle>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            {offerStats.total === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No offers this month</p>
            ) : (
              <div className="flex flex-col items-center py-3">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="52"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(offerStats.rate / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                    />
                  </svg>
                  <span className="text-3xl font-bold text-slate-900">{offerStats.rate}%</span>
                </div>
                <div className="mt-4 flex items-center gap-5 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Accepted: {offerStats.accepted}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    Declined: {offerStats.declined}
                  </span>
                </div>
              </div>
            )}
          </PanelContent>
        </Panel>
      </div>

      {/* ── 6-Month Trend Chart ── */}
      <MetricLineChart
        title="6-Month Revenue vs Production Trend"
        data={trendData}
        lines={[
          { key: "Revenue", name: "Revenue (₹L)", color: chartPalette[1] },
          { key: "Production", name: "Production (₹L)", color: chartPalette[0] },
        ]}
      />

      {/* ── Client Revenue Split ── */}
      <div className="grid gap-4 md:grid-cols-1">
        {clientRevenue.length > 0 && (
          <MetricBarChart
            title={`Client Revenue Split — ${formatMonthLabel(selectedMonth)}`}
            data={clientRevenue.slice(0, 10).map((r) => ({ name: r.clientName, Revenue: Math.round(r.revenue / 100000), Pipeline: Math.round(r.pipelineValue / 100000) }))}
            bars={[
              { key: "Revenue", name: "Revenue (₹L)", color: chartPalette[3] },
              { key: "Pipeline", name: "Pipeline (₹L)", color: chartPalette[4] },
            ]}
            horizontal
          />
        )}
        {clientRevenue.length === 0 && (
          <Panel variant="solid">
            <PanelContent>
              <p className="py-6 text-center text-xs text-slate-400">No revenue data for this month</p>
            </PanelContent>
          </Panel>
        )}
      </div>
    </div>
  );
}

function ClientTab({ state, selectedMonth, activeFilters }: { state: DashboardState; selectedMonth: string | "all"; activeFilters: Parameters<typeof getClientAnalytics>[1] }) {
  const clients = useMemo(() => getClientAnalytics(state, activeFilters, selectedMonth), [state, activeFilters, selectedMonth]);
  const [modalClient, setModalClient] = useState<typeof clients[number] | null>(null);

  const pct = (num: number, den: number) => den === 0 ? null : Math.round((num / den) * 100);

  const STAGE_COLORS = [
    { bar: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700", label: "CVs" },
    { bar: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700", label: "Int" },
    { bar: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", label: "FS" },
    { bar: "bg-violet-500", light: "bg-violet-50", text: "text-violet-700", label: "Sel" },
    { bar: "bg-teal-500", light: "bg-teal-50", text: "text-teal-700", label: "Join" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Client &amp; SPOC Report</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{clients.length} client{clients.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
          <Building2 className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">No client data for this period</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((client) => {
            const stages = [
              { value: client.cvCount, pct: 100 },
              { value: client.interviewCount, pct: pct(client.interviewCount, client.cvCount) },
              { value: client.finalSelectionCount, pct: pct(client.finalSelectionCount, client.interviewCount) },
              { value: client.offerCount, pct: pct(client.offerCount, client.finalSelectionCount) },
              { value: client.joinedCount, pct: pct(client.joinedCount, client.offerCount) },
            ];
            const maxStage = Math.max(...stages.map((s) => s.value), 1);

            return (
              <button
                key={client.clientId}
                onClick={() => setModalClient(client)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 text-left w-full"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500" />

                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold tracking-tight text-slate-900">{client.clientName}</h4>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{client.industry}</span>
                      </div>
                      {client.ownerRecruiterName !== "—" && (
                        <p className="mt-0.5 text-xs text-slate-400">Owner: {client.ownerRecruiterName}</p>
                      )}
                    </div>
                    <div className="shrink-0 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 px-3 py-1.5 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-500">Revenue</p>
                      <p className="text-sm font-bold text-teal-700">₹{formatCurrency(client.revenue)}</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-3">
                  <div className="flex items-center gap-1">
                    {stages.map((s, i) => (
                      <div key={i} className="flex-1">
                        <div className={`rounded-lg ${STAGE_COLORS[i].light} px-2 py-1.5 border border-white/60`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-semibold ${STAGE_COLORS[i].text}`}>{STAGE_COLORS[i].label}</span>
                            <span className={`text-sm font-bold ${STAGE_COLORS[i].text}`}>{s.value}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                            <div className={`h-full rounded-full ${STAGE_COLORS[i].bar} transition-all`} style={{ width: `${maxStage > 0 ? (s.value / maxStage) * 100 : 0}%` }} />
                          </div>
                        </div>
                        {i < stages.length - 1 && s.pct !== null && (
                          <div className="flex justify-center pt-0.5">
                            <span className={`text-[9px] font-bold ${s.pct >= 50 ? "text-emerald-600" : s.pct >= 25 ? "text-amber-600" : "text-red-400"}`}>
                              {s.pct}%
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 px-5 py-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{client.totalPositions} positions</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-400">{client.activePositions} active</span>
                    </div>
                    <span className="flex items-center gap-1 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View SPOCs <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {modalClient && (() => {
        const pocRows = getClientPocBreakdown(state, modalClient.clientId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setModalClient(null)}>
            <div className="mx-4 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">{modalClient.clientName}</h3>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{modalClient.industry}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">Owner: {modalClient.ownerRecruiterName} · {modalClient.totalPositions} positions · Revenue: ₹{formatCurrency(modalClient.revenue)}</p>
                </div>
                <button
                  onClick={() => setModalClient(null)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-4 flex-1">
                {pocRows.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">No SPOCs mapped for this client</p>
                ) : (
                  <div className="space-y-3">
                    {pocRows.map((poc, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm">
                            {poc.spocName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{poc.spocName}</p>
                            <p className="text-xs text-slate-400">SPOC</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Positions", value: poc.positionCount, color: "bg-slate-100 text-slate-700", icon: null },
                            { label: "Candidates", value: poc.candidateCount, color: "bg-blue-50 text-blue-700", icon: null },
                            { label: "Interviews", value: poc.interviewCount, color: "bg-amber-50 text-amber-700", icon: null },
                            { label: "Final Sel.", value: poc.finalSelectionCount, color: "bg-emerald-50 text-emerald-700", icon: null },
                            { label: "Selection", value: poc.offerCount, color: "bg-violet-50 text-violet-700", icon: null },
                            { label: "Joined", value: poc.joinedCount, color: "bg-teal-50 text-teal-700", icon: null },
                          ].map((stat) => (
                            <div key={stat.label} className={`rounded-lg ${stat.color} px-3 py-2 text-center`}>
                              <p className="text-lg font-bold">{stat.value}</p>
                              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {pocRows.length > 0 && (
                <div className="flex items-center gap-4 border-t border-slate-100 px-6 py-3 text-xs text-slate-500 shrink-0">
                  <span className="font-medium text-slate-700">{pocRows.length} SPOC{pocRows.length > 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>Total offers: {pocRows.reduce((s, r) => s + r.offerCount, 0)}</span>
                  <span>·</span>
                  <span>Join rate: {pct(pocRows.reduce((s, r) => s + r.joinedCount, 0), pocRows.reduce((s, r) => s + r.offerCount, 0))}%</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function AnalyticsPage() {
  const { state, activeFilters } = useApp();
  const [activeTab, setActiveTab] = useState<"performance" | "revenue" | "client">("performance");
  const monthOptions = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [clientMonth, setClientMonth] = useState<string | "all">("all");

  if (!state) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Full Recruitment Analytics"
        description="Recruiter performance, revenue tracking, and client insights."
        actions={
          <div className="flex items-center gap-3">
            {(activeTab === "performance" || activeTab === "revenue") && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Month</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}
            {activeTab === "client" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Month</span>
                <select
                  value={clientMonth}
                  onChange={(e) => setClientMonth(e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="all">All Months</option>
                  {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            )}
          </div>
        }
      />

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "performance" && <PerformanceTab state={state} activeFilters={activeFilters} selectedMonth={selectedMonth} />}
      {activeTab === "revenue" && <RevenueTab state={state} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />}
      {activeTab === "client" && <ClientTab state={state} activeFilters={activeFilters} selectedMonth={clientMonth} />}
    </div>
  );
}
