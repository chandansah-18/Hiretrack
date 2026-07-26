"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Trophy, Target, TrendingUp, CalendarDays, Calendar, Clock, Users, UserCheck,
  Banknote, Star, Activity, Send, Handshake, FileText, Zap, ChevronUp,
  Medal, ArrowUp, ArrowDown, BarChart3,
} from "lucide-react";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { MetricLineChart } from "@/components/dashboard/charts";
import { useApp } from "@/components/providers/app-provider";
import {
  getCurrentMonthKey, getRecruiterProfileDetail, getRecruiterExtendedTrends,
  getQuarterKey, getQuarterMonths, getDataMonths,
} from "@/lib/data/selectors";
import { formatCurrency, formatLongDate, formatShortDate, monthKey, formatMonthLabel } from "@/lib/utils";

function CircularRing({ pct, size = 72, strokeWidth = 5 }: { pct: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#f87171";
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

function FunnelStage({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{count}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

const METRICS_CONFIG = [
  { key: "cvCount" as const, label: "CVs Shared", icon: Send, color: "from-blue-500 to-blue-600", bgLight: "bg-blue-50", textColor: "text-blue-600" },
  { key: "l1Interviews" as const, label: "L1 Interviews", icon: FileText, color: "from-amber-500 to-orange-500", bgLight: "bg-amber-50", textColor: "text-amber-600" },
  { key: "l2Interviews" as const, label: "L2 Interviews", icon: Users, color: "from-orange-500 to-red-500", bgLight: "bg-orange-50", textColor: "text-orange-600" },
  { key: "finalSelectCount" as const, label: "Final Selects", icon: Star, color: "from-emerald-500 to-emerald-600", bgLight: "bg-emerald-50", textColor: "text-emerald-600" },
  { key: "selectionCount" as const, label: "Selections", icon: UserCheck, color: "from-teal-500 to-teal-600", bgLight: "bg-teal-50", textColor: "text-teal-600" },
  { key: "joinedCount" as const, label: "Joined", icon: Handshake, color: "from-violet-500 to-purple-600", bgLight: "bg-violet-50", textColor: "text-violet-600" },
];

const RANK_META: Record<number, { label: string; emoji: string; color: string; bg: string }> = {
  1: { label: "1st", emoji: "🥇", color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
  2: { label: "2nd", emoji: "🥈", color: "text-slate-400", bg: "bg-slate-50 border-slate-200" },
  3: { label: "3rd", emoji: "🥉", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
};

function RecruiterProfileContent() {
  const { state, currentRecruiterId } = useApp();
  const monthOptions = useMemo(() => getDataMonths(state).map((m) => ({ label: formatMonthLabel(m), value: m })), [state]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [period, setPeriod] = useState<"month" | "allTime">("month");

  const isManagerOrAbove = state.currentUserRole === "manager" || state.currentUserRole === "admin";
  const searchParams = useSearchParams();
  const initialRecruiterId = useMemo(() => {
    const paramId = searchParams?.get("recruiterId");
    if (isManagerOrAbove && paramId && state.recruiters.some((r) => r.id === paramId)) return paramId;
    return currentRecruiterId;
  }, [searchParams, isManagerOrAbove, state.recruiters, currentRecruiterId]);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState(initialRecruiterId);

  const allProfiles = useMemo(() => getRecruiterProfileDetail(state, selectedMonth), [state, selectedMonth]);
  const profile = allProfiles.find((p) => p.id === selectedRecruiterId);
  const trends = useMemo(
    () => (selectedRecruiterId ? getRecruiterExtendedTrends(state, selectedRecruiterId, period === "month" ? selectedMonth : undefined) : null),
    [state, selectedRecruiterId, period, selectedMonth]
  );

  const recruiter = state.recruiters.find((r) => r.id === selectedRecruiterId);
  const lookups = useMemo(() => {
    const cMap = new Map(state.clients.map((c) => [c.id, c.name]));
    return { clientName: (id: string) => cMap.get(id) ?? "—" };
  }, [state]);

  const topClients = useMemo(() => {
    if (!selectedRecruiterId) return [];
    const counts = new Map<string, number>();
    state.candidates
      .filter((c) => c.recruiterId === selectedRecruiterId)
      .forEach((c) => counts.set(c.clientId, (counts.get(c.clientId) ?? 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ name: lookups.clientName(id), count }));
  }, [state, selectedRecruiterId, lookups]);

  const activityLog = useMemo(() => {
    if (!selectedRecruiterId) return [];
    return state.activityLog
      .filter((a) => a.actorName === recruiter?.name)
      .slice(0, 10);
  }, [state.activityLog, selectedRecruiterId, recruiter]);

  const sortedByMonth = useMemo(
    () => [...allProfiles].sort((a, b) => b.month.cvCount - a.month.cvCount),
    [allProfiles]
  );
  const sortedByAllTime = useMemo(
    () => [...allProfiles].sort((a, b) => b.allTime.cvCount - a.allTime.cvCount),
    [allProfiles]
  );

  const currentQuarterKey = useMemo(() => getQuarterKey(new Date()), []);
  const quarterMonths = useMemo(() => getQuarterMonths(currentQuarterKey), [currentQuarterKey]);

  const quarterStats = useMemo(() => {
    if (!selectedRecruiterId || !recruiter) return { revenue: 0, production: 0, joinedCount: 0, revenueTarget: 0, attainment: 0, monthlyBreakdown: [] as Array<{ month: string; revenue: number; joined: number }>, avgBillValue: 100000 };
    const monthSet = new Set(quarterMonths);
    const qJoinings = state.joinings.filter(
      (j) => j.recruiterId === selectedRecruiterId && j.status === "Joined" && monthSet.has(monthKey(j.joiningDate))
    );
    const qJoinedIds = new Set(qJoinings.map((j) => j.candidateId));
    const qRevenue = state.offers
      .filter((o) => o.recruiterId === selectedRecruiterId && qJoinedIds.has(o.candidateId))
      .reduce((s, o) => s + o.billValue, 0);
    const qProduction = state.offers
      .filter((o) => o.recruiterId === selectedRecruiterId && o.offerDate && monthSet.has(monthKey(o.offerDate)))
      .reduce((s, o) => s + o.billValue, 0);
    const monthlyBreakdown = quarterMonths.map((month) => {
      const mJoinings = state.joinings.filter(
        (j) => j.recruiterId === selectedRecruiterId && j.status === "Joined" && monthKey(j.joiningDate) === month
      );
      const mJoinedIds = new Set(mJoinings.map((j) => j.candidateId));
      const mRevenue = state.offers
        .filter((o) => o.recruiterId === selectedRecruiterId && mJoinedIds.has(o.candidateId))
        .reduce((s, o) => s + o.billValue, 0);
      return { month, revenue: mRevenue, joined: mJoinings.length };
    });
    const recruiterOffers = state.offers.filter((o) => o.recruiterId === selectedRecruiterId);
    const avgBillValue = recruiterOffers.length > 0
      ? recruiterOffers.reduce((s, o) => s + o.billValue, 0) / recruiterOffers.length
      : 100000;
    const qRevenueTarget = (recruiter.target ?? 0) * 3 * (avgBillValue || 100000);
    return {
      revenue: qRevenue,
      production: qProduction,
      joinedCount: qJoinings.length,
      revenueTarget: qRevenueTarget,
      attainment: qRevenueTarget > 0 ? Math.min(Math.round((qRevenue / qRevenueTarget) * 100), 100) : 0,
      monthlyBreakdown,
      avgBillValue,
    };
  }, [state, selectedRecruiterId, quarterMonths, recruiter]);

  const winRate = useMemo(() => {
    if (!selectedRecruiterId) return { accepted: 0, total: 0, rate: 0 };
    const offers = state.offers.filter((o) => o.recruiterId === selectedRecruiterId);
    const accepted = offers.filter((o) => o.selectionStatus === "Joined" || o.selectionStatus === "Joining Pending").length;
    const declined = offers.filter((o) => o.selectionStatus === "Offer Declined").length;
    const total = accepted + declined;
    return { accepted, total, rate: total > 0 ? Math.round((accepted / total) * 100) : 0 };
  }, [state, selectedRecruiterId]);

  const prevMonthKey = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
  }, []);

  const prevMonthRevenue = useMemo(() => {
    if (!selectedRecruiterId) return 0;
    const prevJoinings = state.joinings.filter(
      (j) => j.recruiterId === selectedRecruiterId && j.status === "Joined" && monthKey(j.joiningDate) === prevMonthKey
    );
    const prevJoinedIds = new Set(prevJoinings.map((j) => j.candidateId));
    return state.offers
      .filter((o) => o.recruiterId === selectedRecruiterId && prevJoinedIds.has(o.candidateId))
      .reduce((s, o) => s + o.billValue, 0);
  }, [state, selectedRecruiterId, prevMonthKey]);

  const clientRevenue = useMemo(() => {
    if (!selectedRecruiterId) return [];
    const data = new Map<string, { count: number; revenue: number }>();
    state.candidates
      .filter((c) => c.recruiterId === selectedRecruiterId)
      .forEach((c) => {
        const entry = data.get(c.clientId) ?? { count: 0, revenue: 0 };
        entry.count++;
        const offer = state.offers.find((o) => o.candidateId === c.id && o.recruiterId === selectedRecruiterId);
        if (offer) entry.revenue += offer.billValue;
        data.set(c.clientId, entry);
      });
    return [...data.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, d]) => ({ name: lookups.clientName(id), ...d }));
  }, [state, selectedRecruiterId, lookups]);

  const rankData = period === "month" ? sortedByMonth : sortedByAllTime;
  const myRank = rankData.findIndex((p) => p.id === selectedRecruiterId) + 1;
  const rankTotal = rankData.length;

  if (!state || !profile || !trends || !recruiter) {
    return (
      <div className="space-y-6">
        <p className="py-12 text-center text-sm text-slate-400">Loading profile data…</p>
      </div>
    );
  }

  const stats = profile[period];
  const ach = stats.achievementPct;
  const initials = recruiter.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const maxMetric = Math.max(...METRICS_CONFIG.map((m) => stats[m.key]), 1);
  const chartColors = ["#0f172a", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6"];

  const rankMeta = RANK_META[myRank];

  return (
    <div className="space-y-5">

      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="block h-8 w-1 rounded-full bg-violet-500" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Profile</p>
            <h1 className="font-heading text-lg font-semibold tracking-tight text-slate-900">Recruiter Profile</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isManagerOrAbove && (
            <select
              value={selectedRecruiterId ?? ""}
              onChange={(e) => setSelectedRecruiterId(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-slate-400"
            >
              {state.recruiters.filter((r) => r.active).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-slate-400"
          >
            {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Period Toggle ── */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setPeriod("month")}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
            period === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => setPeriod("allTime")}
          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
            period === "allTime" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          All Time
        </button>
      </div>

      {/* ── Hero Card ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-blue-500/5 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 text-xl font-bold text-white shadow-lg ring-4 ring-white">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">{recruiter.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{recruiter.vertical}</span>
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 font-medium text-violet-700 capitalize">{state.currentUserRole}</span>
                  {recruiter.designation && <span className="text-slate-400">{recruiter.designation}</span>}
                  {recruiter.birthday && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3 w-3" /> {formatLongDate(recruiter.birthday)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <CircularRing pct={ach} size={52} strokeWidth={4} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Target</p>
                  <p className="text-lg font-bold text-slate-900">{ach}%</p>
                  <p className="text-[10px] text-slate-400">{stats.joinedCount}/{recruiter.target}</p>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Revenue</p>
                <p className="text-lg font-bold text-emerald-700">₹{formatCurrency(stats.revenue)}</p>
                {(() => {
                  const mom = prevMonthRevenue === 0 ? 0 : Math.round(((stats.revenue - prevMonthRevenue) / prevMonthRevenue) * 100);
                  if (mom === 0) return null;
                  return (
                    <p className={`text-[10px] font-semibold ${mom > 0 ? "text-emerald-500" : "text-red-400"}`}>
                      {mom > 0 ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                      {Math.abs(mom)}% MoM
                    </p>
                  );
                })()}
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Production</p>
                <p className="text-lg font-bold text-blue-700">₹{formatCurrency(stats.production)}</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${rankMeta ? rankMeta.bg : "bg-white border-slate-200"}`}>
                <span className="text-lg">{rankMeta ? rankMeta.emoji : <Medal className="h-5 w-5 text-slate-400" />}</span>
                <div>
                  <p className={`text-sm font-bold ${rankMeta ? rankMeta.color : "text-slate-600"}`}>
                    #{myRank}<span className="text-[10px] font-medium text-slate-400">/{rankTotal}</span>
                  </p>
                  <p className="text-[9px] text-slate-400">by CVs {period === "month" ? "this month" : "all time"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-500">Joins Target Progress</span>
              <span className="font-bold text-slate-700">{stats.joinedCount} / {recruiter.target} joined</span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-700" style={{ width: `${Math.min(ach, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Quarterly Revenue Target ── */}
      <Panel variant="solid">
        <PanelHeader className="px-4 py-3">
          <PanelTitle className="flex items-center gap-2 text-xs">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
            Quarterly Revenue Target — {currentQuarterKey.replace("FY", "FY ").replace("-", " · ")}
          </PanelTitle>
        </PanelHeader>
        <PanelContent className="px-4 pb-4 pt-0">
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">QTD Revenue</p>
                  <p className="text-xl font-bold text-slate-900">₹{formatCurrency(quarterStats.revenue)}</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quarterly Target</p>
                  <p className="text-xl font-bold text-slate-500">₹{formatCurrency(quarterStats.revenueTarget)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">{quarterStats.attainment}%</p>
                <p className="text-[10px] text-slate-400">attained</p>
              </div>
            </div>
            <div className="relative h-4 overflow-hidden rounded-full bg-slate-100 mt-3">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-700" style={{ width: `${quarterStats.attainment}%` }} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {quarterStats.monthlyBreakdown.map((mb) => {
                const monthTarget = (recruiter?.target ?? 1) * (quarterStats.avgBillValue || 100000);
                const monthPct = monthTarget > 0 ? Math.min(Math.round((mb.revenue / monthTarget) * 100), 100) : 0;
                return (
                  <div key={mb.month}>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-semibold text-slate-500">{formatMonthLabel(mb.month)}</span>
                      <span className="font-bold text-slate-700">{monthPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${monthPct}%` }} />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">₹{formatCurrency(mb.revenue)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </PanelContent>
      </Panel>

      {/* ── KPI Metrics Row ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <CircularRing pct={ach} size={44} strokeWidth={4} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Target</p>
              <p className="text-lg font-bold text-slate-900">{ach}%</p>
              <p className="text-[10px] text-slate-400">{stats.joinedCount}/{recruiter.target} joined</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Revenue</p>
          <p className="text-lg font-bold text-emerald-700">₹{formatCurrency(stats.revenue)}</p>
          {(() => {
            const mom = prevMonthRevenue === 0 ? 0 : Math.round(((stats.revenue - prevMonthRevenue) / prevMonthRevenue) * 100);
            return mom !== 0 ? (
              <p className={`text-[10px] font-semibold ${mom > 0 ? "text-emerald-500" : "text-red-400"}`}>
                <span className="inline-flex items-center gap-0.5">
                  {mom > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(mom)}%
                </span>
                <span className="text-slate-400 font-normal ml-1">vs last month</span>
              </p>
            ) : null;
          })()}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Production</p>
          <p className="text-lg font-bold text-blue-700">₹{formatCurrency(stats.production)}</p>
          <p className="text-[10px] text-slate-400">
            Revenue share: {stats.revenue > 0 && stats.production > 0 ? `${Math.round((stats.revenue / stats.production) * 100)}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Win Rate</p>
          <p className={`text-lg font-bold ${winRate.rate >= 70 ? "text-emerald-700" : winRate.rate >= 40 ? "text-amber-600" : "text-red-500"}`}>
            {winRate.total > 0 ? `${winRate.rate}%` : "—"}
          </p>
          <p className="text-[10px] text-slate-400">{winRate.accepted}/{winRate.total} accepted</p>
        </div>
      </div>

      {/* ── Stage Metrics Cards ── */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {METRICS_CONFIG.map((m) => {
          const val = stats[m.key];
          return (
            <div key={m.key} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-1.5 ${m.bgLight}`}>
                  <m.icon className={`h-3.5 w-3.5 ${m.textColor}`} />
                </div>
                <span className="text-sm font-bold text-slate-900">{val}</span>
              </div>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Funnel + Trend ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Panel variant="frosted" className="overflow-hidden p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-800">Conversion Funnel</h3>
          </div>
          <div className="space-y-4">
            {trends.funnel.map((stage, i) => (
              <FunnelStage
                key={stage.stage}
                label={stage.stage}
                count={stage.count}
                pct={stage.conversionPct}
                color={chartColors[i % chartColors.length]}
              />
            ))}
          </div>
        </Panel>

        {trends.trends.length > 0 && (
          <MetricLineChart
            title="12-Month Performance Trend"
            data={trends.trends.map((t) => ({ name: t.label.slice(0, 3), CVs: t.cvCount, Interviews: t.interviewCount, Joined: t.joinedCount }))}
            lines={[
              { key: "CVs", name: "CVs", color: chartColors[1] },
              { key: "Interviews", name: "Interviews", color: chartColors[2] },
              { key: "Joined", name: "Joined", color: chartColors[0] },
            ]}
          />
        )}
      </div>

      {/* ── Quick Stats + Client Revenue ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <Panel variant="frosted" className="overflow-hidden p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-800">Quick Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: "Screen Rejects", v: trends.screenRejects, icon: "XCircle" },
              { l: "Feedback Pending", v: trends.feedbackPending, icon: "Clock" },
              { l: "Interviews Done", v: trends.interviewsDone, icon: "UserCheck" },
              { l: "Last Joined", v: trends.lastJoiningDate ? formatShortDate(trends.lastJoiningDate) : "—", icon: "Calendar" },
              { l: "Last Final Select", v: trends.lastFinalSelectDate ? formatShortDate(trends.lastFinalSelectDate) : "—", icon: "Star" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.l}</p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{s.v}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel variant="frosted" className="overflow-hidden p-5">
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-800">Client Revenue</h3>
          </div>
          {clientRevenue.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No client revenue data</p>
          ) : (
            <div className="space-y-2">
              {clientRevenue.map((c, i) => {
                const maxRev = Math.max(...clientRevenue.map((x) => x.revenue), 1);
                return (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-400">{i + 1}</span>
                        <span className="truncate font-medium text-slate-800">{c.name}</span>
                      </div>
                      <span className="shrink-0 font-bold text-emerald-700">₹{formatCurrency(c.revenue)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${(c.revenue / maxRev) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Recent Activity ── */}
      <Panel variant="frosted" className="overflow-hidden p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
        </div>
        {activityLog.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {activityLog.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3 text-sm transition hover:bg-slate-50/50">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900">{log.actorName}</span> {log.description}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatLongDate(log.timestamp.slice(0, 10))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

    </div>
  );
}

export default function RecruiterProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-slate-400">Loading profile...</div>}>
      <RecruiterProfileContent />
    </Suspense>
  );
}
