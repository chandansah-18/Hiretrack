"use client";

import { useState, useMemo } from "react";
import {
  Users, Calendar, Target, Handshake, TrendingUp, TrendingDown,
  Minus, ArrowRight, AlertTriangle, Activity, Clock,
  Briefcase, Zap, CalendarDays, type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useApp } from "@/components/providers/app-provider";
import {
  getCurrentMonthKey, getMomTrends, getDashboardFunnel,
  getMomChange, getWeekSummary, getAgingPipeline,
  getUpcomingInterviews, getInterviewRoundBreakdown, getDataMonths,
} from "@/lib/data/selectors";
import { formatShortDate, formatMonthLabel, monthKey } from "@/lib/utils";
import type { DashboardState } from "@/lib/data/types";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Panel } from "@/components/ui/panel";

type AccentKey = "blue" | "emerald" | "amber" | "violet";

const accentStyles: Record<AccentKey, { bar: string; bg: string; text: string }> = {
  blue: { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  emerald: { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  amber: { bar: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  violet: { bar: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700" },
};

const chartHex: Record<AccentKey, string> = {
  blue: "#3b82f6", emerald: "#10b981", amber: "#f59e0b", violet: "#8b5cf6",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return formatShortDate(ts);
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v) => ({ v }));
  if (chartData.every((d) => d.v === 0)) return <div className="h-10" />;
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sg-${color.replace("#", "")})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiTile({
  label, value, delta, trend, accent, icon: Icon, isAll,
}: {
  label: string; value: number; delta: number; trend: number[];
  accent: AccentKey; icon: LucideIcon; isAll?: boolean;
}) {
  const s = accentStyles[accent];
  const isPos = delta > 0;
  const isNeg = delta < 0;
  const DIcon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  const dc = isPos ? "text-emerald-600" : isNeg ? "text-red-500" : "text-slate-400";
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08),0_0_0_1px_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition hover:shadow-[0_24px_80px_rgba(15,23,42,0.12),0_0_0_1px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-0.5">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${s.bar}`} />
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 break-words text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${s.bg}`}>
          <Icon className={`h-5 w-5 ${s.text}`} />
        </div>
      </div>
      <div className="-mx-1 mt-1">
        <Sparkline data={trend} color={chartHex[accent]} />
      </div>
      {!isAll && (
        <div className="flex items-center gap-1.5">
          <DIcon className={`h-3.5 w-3.5 ${dc}`} />
          <span className={`text-xs font-medium ${dc}`}>
            {isPos ? "+" : ""}{delta}% vs last month
          </span>
        </div>
      )}
    </div>
  );
}

function KpiSection({ state, selectedMonth, isAll }: { state: DashboardState; selectedMonth: string | "all"; isAll: boolean }) {
  const funnel = useMemo(() => getDashboardFunnel(state, selectedMonth), [state, selectedMonth]);
  const trends = useMemo(() => getMomTrends(state), [state]);
  const momChange = useMemo(() => getMomChange(state, isAll ? getCurrentMonthKey() : selectedMonth), [state, selectedMonth, isAll]);

  const cvTrend = useMemo(() => trends.map((t) => t.cvShared), [trends]);
  const intTrend = useMemo(() => trends.map((t) => t.interviewsDone), [trends]);
  const fsTrend = useMemo(() => trends.map((t) => t.finalSelects), [trends]);
  const jnTrend = useMemo(() => trends.map((t) => t.joined), [trends]);

  const kpis = [
    { label: "CVs Shared", value: funnel.cvShared, delta: momChange.cvShared, trend: cvTrend, accent: "blue" as AccentKey, icon: Users },
    { label: "Interviews Done", value: funnel.interviewsDone, delta: momChange.interviewsDone, trend: intTrend, accent: "emerald" as AccentKey, icon: Calendar },
    { label: "Final Select", value: funnel.finalSelects, delta: momChange.finalSelects, trend: fsTrend, accent: "amber" as AccentKey, icon: Target },
    { label: "Joined", value: funnel.joined, delta: momChange.joined, trend: jnTrend, accent: "violet" as AccentKey, icon: Handshake },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => <KpiTile key={kpi.label} {...kpi} isAll={isAll} />)}
    </div>
  );
}

function FunnelSection({ state, selectedMonth, isAll }: { state: DashboardState; selectedMonth: string | "all"; isAll: boolean }) {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const funnel = useMemo(() => getDashboardFunnel(state, selectedMonth), [state, selectedMonth]);
  const weekSummary = useMemo(() => getWeekSummary(state, selectedWeek), [state, selectedWeek]);
  const months = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);
  const monthLabel = isAll ? "All time" : (months.find((m) => m.value === selectedMonth)?.label ?? "");

  const weekLabels = ["This Week", "Last Week", "2 Weeks Ago", "3 Weeks Ago", "4 Weeks Ago"];

  const weekItems = [
    { label: "CVs Shared", value: weekSummary.cvShared, color: "#3b82f6" },
    { label: "Interviews Done", value: weekSummary.interviewsDone, color: "#10b981" },
    { label: "Final Select", value: weekSummary.finalSelects, color: "#f59e0b" },
    { label: "Joined", value: weekSummary.joined, color: "#8b5cf6" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <Panel variant="frosted" className="overflow-hidden p-5">
        <div className="flex items-center gap-2 mb-5">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-800">Conversion Funnel</h3>
          <span className="text-xs text-slate-400">— {monthLabel}</span>
        </div>
        <div className="space-y-0">
          {([
            { label: "CVs Shared", key: "cvShared" as const, color: "#3b82f6", value: funnel.cvShared, nextPct: funnel.cvToIntPct },
            { label: "Interviews Done", key: "interviewsDone" as const, color: "#10b981", value: funnel.interviewsDone, nextPct: funnel.intToFinalPct },
            { label: "Final Select", key: "finalSelects" as const, color: "#f59e0b", value: funnel.finalSelects, nextPct: funnel.finalToJoinedPct },
            { label: "Joined", key: "joined" as const, color: "#8b5cf6", value: funnel.joined, nextPct: null },
          ] as const).map((stage, i) => {
            const pct = funnel.cvShared > 0 ? Math.round((stage.value / funnel.cvShared) * 100) : 0;
            return (
              <div key={stage.key}>
                <div className="flex items-center gap-4 py-3">
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-medium text-slate-700">{stage.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stage.value}</p>
                  </div>
                  <div className="flex-1 h-7 rounded-lg bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-lg transition-all duration-500 flex items-center justify-end px-2" style={{ width: `${pct}%`, backgroundColor: stage.color }}>
                      {pct > 15 && <span className="text-xs font-semibold text-white/90">{pct}%</span>}
                    </div>
                  </div>
                  {stage.nextPct !== null && (
                    <div className="w-16 shrink-0 flex items-center gap-1">
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500">{stage.nextPct}%</span>
                    </div>
                  )}
                </div>
                {i < 3 && <div className="ml-32 mr-[4.5rem] border-t border-dashed border-slate-200" />}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel variant="frosted" className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-800">Week</h3>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="ml-auto h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none focus:border-slate-400"
            >
              {weekLabels.map((lbl, i) => (
                <option key={i} value={i}>{lbl}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            {weekItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-semibold text-slate-500">{item.label}</span>
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function AttentionSection({ state, selectedMonth, isAll }: { state: DashboardState; selectedMonth: string | "all"; isAll: boolean }) {
  const agingItems = useMemo(() => getAgingPipeline(state), [state]);
  const upcoming = useMemo(() => getUpcomingInterviews(state), [state]);
  const roundBreakdown = useMemo(() => getInterviewRoundBreakdown(state, isAll ? "all" : selectedMonth), [state, selectedMonth, isAll]);

  const pipelineStages = useMemo(() => {
    const candidates = isAll ? state.candidates : state.candidates.filter((c) => monthKey(c.submittedAt) === selectedMonth);
    const joinings = isAll ? state.joinings : state.joinings.filter((j) => monthKey(j.joiningDate) === selectedMonth);
    const totalCvs = candidates.length;
    const inProgress = candidates.filter(
      (c) => c.stage !== "CV Submitted" && c.stage !== "Final Selection" && c.stage !== "Offer" && c.stage !== "Joined" && c.stage !== "Screen Reject" && c.stage !== "Drop" && c.stage !== "Duplicate" && c.stage !== "Rejected"
    ).length;
    const finalSelect = candidates.filter((c) => c.stage === "Final Selection").length;
    const joined = joinings.filter((j) => j.status === "Joined").length;
    return [
      { label: "CVs Shared", color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700", value: totalCvs },
      { label: "In Progress", color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700", value: inProgress },
      { label: "Final Select", color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", value: finalSelect },
      { label: "Joined", color: "bg-violet-500", light: "bg-violet-50", text: "text-violet-700", value: joined },
    ];
  }, [state, selectedMonth, isAll]);

  const urgencyColors: Record<string, string> = {
    urgent: "bg-red-500", soon: "bg-amber-400", later: "bg-blue-400",
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Panel variant="frosted" className="overflow-hidden p-5">
        <div className="flex min-w-0 items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="min-w-0 break-words text-sm font-semibold text-slate-800">Needs Attention</h3>
          {(upcoming.length + agingItems.length) > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">{upcoming.length + agingItems.length}</span>
          )}
        </div>

        {upcoming.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming Today</p>
            <div className="space-y-1.5">
              {upcoming.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 block h-2 w-2 rounded-full ${urgencyColors[item.urgency]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.candidateName}</p>
                      <p className="text-xs text-slate-400 truncate">{item.round} · {item.positionName}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {agingItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Aging Pipeline</p>
            <div className="space-y-1.5">
              {agingItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 block h-2 w-2 rounded-full ${item.severity === "red" ? "bg-red-500" : "bg-amber-400"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
                      <p className="text-xs text-slate-400 truncate">{item.detail}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${item.severity === "red" ? "text-red-500" : "text-amber-500"}`}>{item.daysSince}d</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcoming.length === 0 && agingItems.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">All clear — no items need attention.</p>
        )}
      </Panel>

      <Panel variant="frosted" className="overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-800">Pipeline Overview</h3>
          </div>

          {/* Pipeline flow stages */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {pipelineStages.map((s, i) => (
              <div key={s.label} className="relative">
                <div className={`rounded-xl ${s.light} p-3 border border-white/60 shadow-sm`}>
                  <div className={`h-1.5 w-full rounded-full ${s.color} mb-2`} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                  <p className={`mt-0.5 text-2xl font-bold tracking-tight ${s.text}`}>{s.value}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Interview Rounds */}
          {roundBreakdown.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rounds Breakdown</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {roundBreakdown.map((r) => {
                  const pct = r.total > 0 ? (r.done / r.total) * 100 : 0;
                  const remPct = 100 - pct;
                  return (
                    <div key={r.round} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-600">{r.round}</span>
                        <span className="text-[11px] text-slate-400">{r.done}/{r.total}</span>
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-[11px]">
                        <span className="text-amber-600 font-medium">{r.scheduled} scheduled</span>
                        <span className="text-emerald-600 font-medium">{r.done} done</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function TodaySection({ state }: { state: DashboardState }) {
  const upcoming = useMemo(() => getUpcomingInterviews(state), [state]);
  const todayInterviews = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return state.interviews.filter((i) => i.interviewDate.slice(0, 10) === todayKey);
  }, [state]);

  const urgencyColors: Record<string, string> = {
    urgent: "bg-red-500", soon: "bg-amber-400", later: "bg-blue-400",
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Panel variant="frosted" className="overflow-hidden p-5">
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-800">Today's Interviews</h3>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-bold text-slate-900">{todayInterviews.length}</span>
          <span className="text-sm text-slate-400">scheduled today</span>
        </div>
        <div className="flex gap-4">
          <div className="flex-1 rounded-xl bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-600 font-medium">Done</p>
            <p className="text-xl font-bold text-emerald-700">{todayInterviews.filter((i) => i.status.endsWith("Done") || i.status.endsWith("Select") || i.status.endsWith("Reject") || i.status === "Final Select").length}</p>
          </div>
          <div className="flex-1 rounded-xl bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-600 font-medium">Pending</p>
            <p className="text-xl font-bold text-amber-700">{todayInterviews.filter((i) => !i.status.endsWith("Done") && !i.status.endsWith("Select") && !i.status.endsWith("Reject") && i.status !== "Final Select" && i.status !== "Cancelled" && i.status !== "No Show" && i.status !== "Panel No Show").length}</p>
          </div>
          <div className="flex-1 rounded-xl bg-red-50 px-3 py-2">
            <p className="text-xs text-red-600 font-medium">Cancelled</p>
            <p className="text-xl font-bold text-red-700">{todayInterviews.filter((i) => i.status === "Cancelled" || i.status === "No Show" || i.status === "Panel No Show").length}</p>
          </div>
        </div>
      </Panel>

      <Panel variant="frosted" className="overflow-hidden p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-800">Upcoming</h3>
          {upcoming.length > 0 && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600">{upcoming.length}</span>}
        </div>
        {upcoming.length > 0 ? (
          <div className="space-y-2">
            {upcoming.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 block h-2.5 w-2.5 rounded-full ${urgencyColors[item.urgency]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{item.candidateName}</p>
                    <p className="text-xs text-slate-400 truncate">{item.round} · {item.positionName}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-slate-500">{item.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No upcoming interviews</p>
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function DashboardHomePage() {
  const { state } = useApp();
  const [selectedMonth, setSelectedMonth] = useState<string | "all">(getCurrentMonthKey());
  const months = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);
  const isAll = selectedMonth === "all";

  return (
    <div className="space-y-6">

      {/* ── Row 0: Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Huntsmen & Barons</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Command Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time recruitment snapshot — pipeline health, weekly pulse, and urgent items at a glance.
          </p>
        </div>
        <div className="mt-3 sm:mt-0">
          <label htmlFor="month-select" className="sr-only">Filter by month</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">All Months</option>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Row 1: Enhanced KPI Tiles ── */}
      <ErrorBoundary name="KPI tiles">
        <KpiSection state={state} selectedMonth={selectedMonth} isAll={isAll} />
      </ErrorBoundary>

      {/* ── Row 2: Conversion Funnel + This Week ── */}
      <ErrorBoundary name="Funnel & Week">
        <FunnelSection state={state} selectedMonth={selectedMonth} isAll={isAll} />
      </ErrorBoundary>

      {/* ── Row 3: Needs Attention + Pipeline Overview ── */}
      <ErrorBoundary name="Attention & Pipeline">
        <AttentionSection state={state} selectedMonth={selectedMonth} isAll={isAll} />
      </ErrorBoundary>

      {/* ── Row 4: Today's Interviews + Upcoming ── */}
      <ErrorBoundary name="Today's interviews">
        <TodaySection state={state} />
      </ErrorBoundary>

    </div>
  );
}
