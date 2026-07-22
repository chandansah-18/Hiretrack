"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { UserPlus, Pencil, Trash2, Check, X, Shield, Power, PowerOff, Plus, Search, LayoutDashboard, Users, Database, ClipboardList, Eye, EyeOff, Download, Upload, Target, TrendingUp, BarChart3, Medal, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import {
  fetchUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  exportSupabaseBackupAction,
  getStorageStatsAction,
  archiveOldDataAction,
  purgeArchivedDataAction,
} from "./actions";
import { loadDashboardState, saveDashboardState } from "@/lib/data/storage";
import { loadUsers as loadLocalUsers, addUser, updateUser, removeUser, hashPassword, saveUsers } from "@/lib/auth/users";
import { useApp } from "@/components/providers/app-provider";
import type { Role, Recruiter, Client, ClientSpoc, DashboardState } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { createPrefixedId } from "@/lib/data/id";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getCurrentMonthKey, getDataMonths } from "@/lib/data/selectors";
import { formatMonthLabel, formatCurrency, monthKey } from "@/lib/utils";

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-600">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400" />
    </div>
  );
}

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "targets", label: "Targets", icon: Target },
  { key: "users", label: "Users", icon: Shield },
  { key: "master-data", label: "Master Data", icon: Database },
  { key: "activity-log", label: "Activity Log", icon: ClipboardList },
] as const;

export default function AdminPage() {
  const { session } = useAuth();
  const { state, setRole, addRecruiter, updateRecruiter, deleteRecruiter, addClient, updateClient, deleteClient, addSpoc, updateSpoc, deleteSpoc } = useApp();
  const [activeTab, setActiveTab] = useState<string>("overview");

  if (session?.role !== "admin") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-slate-400">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Control Room</h1>
          <p className="mt-1 text-sm text-slate-500">System administration, user management, and master data.</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-[28px] border border-slate-200/60 bg-slate-50/90 p-1 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] backdrop-blur-md">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && <OverviewSection />}
      {activeTab === "users" && <UsersSection />}
      {activeTab === "targets" && <TargetsSection />}
      {activeTab === "master-data" && <MasterDataSection />}
      {activeTab === "activity-log" && <ActivityLogSection />}
    </div>
  );

  function TargetsSection() {
    const [targetMonth, setTargetMonth] = useState(getCurrentMonthKey());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState(0);

    const dataMonths = useMemo(() => getDataMonths(state), [state]);

    const targetData = useMemo(() => {
      return state.recruiters
        .filter((r) => r.active)
        .map((r) => {
          const monthJoinings = state.joinings.filter(
            (j) => j.recruiterId === r.id && j.status === "Joined" && monthKey(j.joiningDate) === targetMonth
          );
          const monthJoinedIds = new Set(monthJoinings.map((j) => j.candidateId));
          const revenue = state.offers
            .filter((o) => o.recruiterId === r.id && monthJoinedIds.has(o.candidateId))
            .reduce((s, o) => s + o.billValue, 0);
          return {
            id: r.id,
            name: r.name,
            vertical: r.vertical,
            target: r.target,
            joined: monthJoinings.length,
            revenue,
            achievement: r.target > 0 ? Math.min(Math.round((monthJoinings.length / r.target) * 100), 100) : 0,
          };
        })
        .sort((a, b) => b.achievement - a.achievement);
    }, [state, targetMonth]);

    const totalTarget = targetData.reduce((s, r) => s + r.target, 0);
    const totalJoined = targetData.reduce((s, r) => s + r.joined, 0);

    const startEdit = (rid: string, current: number) => { setEditingId(rid); setEditValue(current); };
    const saveEdit = (rid: string) => {
      const existing = state.recruiters.find((r) => r.id === rid);
      if (!existing) return;
      updateRecruiter(rid, { ...existing, target: editValue });
      setEditingId(null);
      toast.success("Target updated");
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Set and track monthly joining targets for each recruiter.</p>
          <select
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-slate-400"
          >
            {dataMonths.length > 0
              ? dataMonths.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)
              : <option value={targetMonth}>{formatMonthLabel(targetMonth)}</option>
            }
          </select>
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Active Recruiters</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{targetData.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Target</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{totalTarget}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Achieved</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">{totalJoined}</p>
            <p className="text-[10px] text-slate-400">{totalTarget > 0 ? `${Math.round((totalJoined / totalTarget) * 100)}% attainment` : "\u2014"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{targetData[0]?.name ?? "\u2014"}</p>
            <p className="mt-1 text-xl font-bold text-amber-600">{targetData[0] ? `${targetData[0].achievement}%` : "\u2014"}</p>
            <p className="text-[10px] text-slate-400">Top achiever</p>
          </div>
        </div>

        <Panel variant="frosted" className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Recruiter</th>
                <th className="px-4 py-2.5 font-medium">Vertical</th>
                <th className="px-4 py-2.5 font-medium text-right">Target</th>
                <th className="px-4 py-2.5 font-medium text-right">Joined</th>
                <th className="px-4 py-2.5 font-medium text-right">Revenue</th>
                <th className="px-4 py-2.5 font-medium text-right w-44">Achievement</th>
                <th className="px-4 py-2.5 font-medium text-right w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {targetData.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{r.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{r.vertical}</td>
                  <td className="px-4 py-2.5 text-right">
                    {editingId === r.id ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        className="w-20 rounded border border-slate-300 px-2 py-0.5 text-right text-xs outline-none focus:border-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span className="font-semibold text-slate-700">{r.target}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{r.joined}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-700">₹{formatCurrency(r.revenue)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-full max-w-[80px] overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${r.achievement >= 80 ? "bg-emerald-500" : r.achievement >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                          style={{ width: `${Math.min(r.achievement, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold w-8 text-right ${r.achievement >= 80 ? "text-emerald-600" : r.achievement >= 50 ? "text-amber-600" : "text-red-500"}`}>
                        {r.achievement}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {editingId === r.id ? (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => saveEdit(r.id)} className="rounded p-1 text-emerald-600 hover:bg-emerald-100"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(r.id, r.target)} className="rounded p-1 text-slate-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {targetData.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No active recruiters found.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    );
  }

  function OverviewSection() {
    const stats = {
      recruiters: state.recruiters.length,
      clients: state.clients.length,
      positions: state.positions.length,
      candidates: state.candidates.length,
      interviews: state.interviews.length,
      offers: state.offers.length,
      joinings: state.joinings.length,
    };

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
          {[
            { key: "recruiters", label: "Recruiters", icon: Users, gradient: "from-violet-500 to-purple-600", light: "bg-violet-50", text: "text-violet-700" },
            { key: "clients", label: "Clients", icon: Users, gradient: "from-blue-500 to-blue-600", light: "bg-blue-50", text: "text-blue-700" },
            { key: "positions", label: "Positions", icon: BarChart3, gradient: "from-amber-500 to-orange-600", light: "bg-amber-50", text: "text-amber-700" },
            { key: "candidates", label: "Candidates", icon: UserCheck, gradient: "from-emerald-500 to-emerald-600", light: "bg-emerald-50", text: "text-emerald-700" },
            { key: "interviews", label: "Interviews", icon: TrendingUp, gradient: "from-rose-500 to-pink-600", light: "bg-rose-50", text: "text-rose-700" },
            { key: "offers", label: "Offers", icon: Medal, gradient: "from-teal-500 to-teal-600", light: "bg-teal-50", text: "text-teal-700" },
            { key: "joinings", label: "Joinings", icon: Target, gradient: "from-indigo-500 to-indigo-600", light: "bg-indigo-50", text: "text-indigo-700" },
          ].map((item) => {
            const val = stats[item.key as keyof typeof stats];
            return (
              <div key={item.key} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
                <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${item.gradient}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                      <p className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{val}</p>
                    </div>
                    <div className={`rounded-xl p-2 ${item.light}`}>
                      <item.icon className={`h-4 w-4 ${item.text}`} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Panel variant="frosted" className="p-4">
            <p className="text-xs font-semibold text-slate-700">UI preview (not real permissions)</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Preview how screens look for other roles. This does <strong>not</strong> change your Auth role or database permissions — your session stays admin.
            </p>
            <div className="mt-3 flex gap-2">
              {(["admin", "manager", "recruiter"] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setRole(role)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    state.currentUserRole === role
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Preview role: <span className="font-medium capitalize text-slate-700">{state.currentUserRole}</span>
              {" · "}
              Auth role: <span className="font-medium capitalize text-slate-700">{session?.role ?? "—"}</span>
            </p>
          </Panel>

          <Panel variant="frosted" className="p-4">
            <p className="text-xs font-semibold text-slate-700">System Info</p>
            <div className="mt-2 space-y-1 text-[11px] text-slate-500">
              <p>Session: <span className="font-medium text-slate-700">{session?.name ?? "\u2014"}</span></p>
              <p>Email: <span className="font-medium text-slate-700">{session?.email ?? "\u2014"}</span></p>
              <p>Role: <span className="font-medium capitalize text-slate-700">{session?.role ?? "\u2014"}</span></p>
              <p>Total recruiter profiles: <span className="font-medium text-slate-700">{stats.recruiters}</span></p>
            </div>
          </Panel>
        </div>

        <DataBackupSection />
        <StorageArchiveSection />
      </div>
    );
  }

  function formatBytes(bytes: number | null | undefined) {
    if (bytes == null || Number.isNaN(Number(bytes))) return "—";
    const value = Number(bytes);
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function DataBackupSection() {
    const [busy, setBusy] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const isSupabase = Boolean(getBrowserSupabaseClient());

    const downloadJson = (payload: unknown, filename: string) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
      setBusy(true);
      try {
        if (isSupabase) {
          const res = await exportSupabaseBackupAction();
          if (!res.success) {
            toast.error(res.error || "Backup failed");
            return;
          }
          downloadJson(res.backup, `huntsmen-barons-supabase-backup-${new Date().toISOString().slice(0, 10)}.json`);
          toast.success("Supabase backup downloaded");
          return;
        }

        const dashboard = loadDashboardState();
        const users = loadLocalUsers();
        downloadJson(
          { dashboard, users, exportedAt: new Date().toISOString(), source: "local" },
          `huntsmen-barons-local-backup-${new Date().toISOString().slice(0, 10)}.json`
        );
        toast.success("Local backup downloaded");
      } finally {
        setBusy(false);
      }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (isSupabase) {
          toast.error("Import into Supabase is disabled here for safety. Use archive/purge tools or restore from a DB backup.");
          return;
        }
        if (data.dashboard) {
          saveDashboardState(data.dashboard);
        }
        if (data.users) {
          saveUsers(data.users);
        }
        toast.success("Data restored — reloading...");
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error("Invalid backup file");
      } finally {
        setBusy(false);
        e.target.value = "";
      }
    };

    return (
      <Panel variant="frosted" className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-700">Data Backup</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {isSupabase
                ? "Exports live Supabase tables as JSON. Keep this file before archive/purge."
                : "Exports local browser data (dev mode only)."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void handleExport()} disabled={busy}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {busy ? "Working…" : "Export backup"}
            </Button>
            {!isSupabase && (
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Import
              </Button>
            )}
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </div>
      </Panel>
    );
  }

  function StorageArchiveSection() {
    const [stats, setStats] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [beforeDate, setBeforeDate] = useState(() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().slice(0, 10);
    });
    const isSupabase = Boolean(getBrowserSupabaseClient());
    const { refreshState } = useApp();

    useEffect(() => {
      if (!isSupabase) {
        setLoading(false);
        return;
      }
      void (async () => {
        setLoading(true);
        const res = await getStorageStatsAction();
        if (res.success) setStats(res.stats);
        setLoading(false);
      })();
    }, [isSupabase]);

    if (!isSupabase) return null;

    const databaseBytes = typeof stats?.databaseBytes === "number" ? stats.databaseBytes : null;
    const limitBytes = 2 * 1024 * 1024 * 1024;
    const usagePct = databaseBytes != null ? Math.min(100, Math.round((databaseBytes / limitBytes) * 100)) : null;

    const handleArchive = async () => {
      setBusy(true);
      try {
        const backup = await exportSupabaseBackupAction();
        if (!backup.success) {
          toast.error(backup.error || "Export backup before archive failed");
          return;
        }
        const blob = new Blob([JSON.stringify(backup.backup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pre-archive-backup-${beforeDate}.json`;
        a.click();
        URL.revokeObjectURL(url);

        const res = await archiveOldDataAction(beforeDate);
        if (!res.success) {
          toast.error(res.error || "Archive failed");
          return;
        }
        toast.success(`Archived closed candidates before ${beforeDate}`);
        const statsRes = await getStorageStatsAction();
        if (statsRes.success) setStats(statsRes.stats);
        await refreshState();
      } finally {
        setBusy(false);
      }
    };

    const handlePurge = async () => {
      if (!window.confirm(`Permanently delete archived candidates with archived_at before ${beforeDate}? This cannot be undone.`)) {
        return;
      }
      setBusy(true);
      try {
        const res = await purgeArchivedDataAction(beforeDate);
        if (!res.success) {
          toast.error(res.error || "Purge failed");
          return;
        }
        toast.success("Purged archived records");
        const statsRes = await getStorageStatsAction();
        if (statsRes.success) setStats(statsRes.stats);
        await refreshState();
      } finally {
        setBusy(false);
      }
    };

    return (
      <Panel variant="frosted" className="p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-700">Storage &amp; Archive</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Soft-archive closed pipeline older than a cutoff, then purge after you have a backup. Plan around the 2 GB database limit.
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400">Loading storage stats…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">DB size</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formatBytes(databaseBytes)}</p>
              {usagePct != null && <p className="text-[10px] text-slate-400">{usagePct}% of 2 GB</p>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Active candidates</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{String(stats?.candidates ?? "—")}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Archived</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{String(stats?.candidatesArchived ?? "—")}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Oldest / newest</p>
              <p className="mt-1 text-[11px] font-medium text-slate-700">
                {String(stats?.oldestCandidate ?? "—")} → {String(stats?.newestCandidate ?? "—")}
              </p>
            </div>
          </div>
        )}

        {typeof stats?.note === "string" && (
          <p className="text-[11px] text-amber-700">{stats.note}</p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-[11px] text-slate-500">
            Cutoff date
            <input
              type="date"
              value={beforeDate}
              onChange={(e) => setBeforeDate(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-800"
            />
          </label>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void handleArchive()}>
            Backup + archive closed
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => void handlePurge()}>
            Purge archived
          </Button>
        </div>
      </Panel>
    );
  }

  function UsersSection() {
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
      name: "",
      email: "",
      role: "recruiter",
      password: "",
      active: true,
    });

    const loadData = async () => {
      setLoading(true);
      const res = await fetchUsersAction();
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        const local = loadLocalUsers();
        setUsers(local.map(u => ({ ...u, role: u.role as string })));
      }
      setLoading(false);
    };

    useEffect(() => {
      void loadData();
    }, []);

    const handleCreate = async () => {
      if (!formData.email.endsWith("@huntsmenbarons.com")) {
        toast.error("Email must be a @huntsmenbarons.com address");
        return;
      }
      if (!formData.name.trim()) {
        toast.error("Name is required");
        return;
      }
      if (!formData.password || formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      const toastId = toast.loading("Creating user...");
      const res = await createUserAction(formData);
      if (res.success) {
        toast.success("User created successfully", { id: toastId });
        setIsAdding(false);
        loadData();
      } else if (res.error === "Supabase not configured") {
        try {
          const hash = await hashPassword(formData.password);
          addUser({
            id: createPrefixedId("user"),
            name: formData.name,
            email: formData.email,
            role: formData.role as "admin" | "manager" | "recruiter",
            passwordHash: hash,
            active: formData.active,
          });
          toast.success("Local user created successfully", { id: toastId });
          setIsAdding(false);
          loadData();
        } catch (e: any) {
          toast.error("Failed to create user: " + e.message, { id: toastId });
        }
      } else {
        toast.error(res.error || "Failed to create user", { id: toastId });
      }
    };

    const handleUpdate = async (id: string) => {
      const toastId = toast.loading("Updating user...");
      const payload: any = {
        name: formData.name,
        role: formData.role,
        active: formData.active,
        ...(formData.password ? { password: formData.password } : {}),
      };
      const res = await updateUserAction(id, payload);
      if (res.success) {
        toast.success("User updated successfully", { id: toastId });
        setEditingId(null);
        loadData();
      } else if (res.error === "Supabase not configured") {
        try {
          const localPayload: any = { name: formData.name, role: formData.role as "admin" | "manager" | "recruiter", active: formData.active };
          if (formData.password) localPayload.passwordHash = await hashPassword(formData.password);
          updateUser(id, localPayload);
          toast.success("Local user updated successfully", { id: toastId });
          setEditingId(null);
          loadData();
        } catch (e: any) {
          toast.error("Failed to update user: " + e.message, { id: toastId });
        }
      } else {
        toast.error(res.error || "Failed to update user", { id: toastId });
      }
    };

    const handleDelete = async (id: string, name: string) => {
      if (!confirm(`Are you sure you want to delete ${name}?`)) return;
      const toastId = toast.loading("Deleting user...");
      const res = await deleteUserAction(id);
      if (res.success) {
        toast.success("User deleted successfully", { id: toastId });
        loadData();
      } else if (res.error === "Supabase not configured") {
        removeUser(id);
        toast.success("Local user deleted successfully", { id: toastId });
        loadData();
      } else {
        toast.error(res.error || "Failed to delete user", { id: toastId });
      }
    };

    const startEdit = (user: UserAccount) => {
      setFormData({ name: user.name, email: user.email, role: user.role, active: user.active, password: "" });
      setEditingId(user.id);
      setIsAdding(false);
    };

    const cancelEdit = () => { setEditingId(null); setIsAdding(false); };
    const openAdd = () => {
      setFormData({ name: "", email: "@huntsmenbarons.com", role: "recruiter", password: "", active: true });
      setIsAdding(true);
      setEditingId(null);
    };

    const RoleSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <select
        className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="recruiter">Recruiter</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>
    );

    const roleBadge = (role: string) => {
      const styles: Record<string, string> = {
        admin: "bg-amber-100 text-amber-800",
        manager: "bg-purple-100 text-purple-800",
        recruiter: "bg-blue-100 text-blue-800",
      };
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[role] || "bg-slate-100 text-slate-800"}`}>
          {role === "admin" && <Shield className="mr-1 h-3 w-3" />}
          {role}
        </span>
      );
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Manage employee accounts, roles, and passwords.</p>
          <Button onClick={openAdd} disabled={isAdding} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <UserPlus className="h-4 w-4" /> Add User
          </Button>
        </div>
        <Panel variant="frosted" className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-5 py-3 font-medium text-xs">Name</th>
                <th className="px-5 py-3 font-medium text-xs">Email</th>
                <th className="px-5 py-3 font-medium text-xs">Role</th>
                <th className="px-5 py-3 font-medium text-xs">Status</th>
                <th className="px-5 py-3 font-medium text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isAdding && (
                <tr className="bg-blue-50/50">
                  <td className="p-3">
                    <input className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </td>
                  <td className="p-3">
                    <input className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </td>
                  <td className="p-3">
                    <RoleSelect value={formData.role} onChange={(v) => setFormData({ ...formData, role: v })} />
                  </td>
                  <td className="p-3">
                    <input type="password" className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500" placeholder="Password (min 8 chars)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={handleCreate} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-100"><Check className="h-4 w-4" /></button>
                    <button onClick={cancelEdit} className="rounded p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                  </td>
                </tr>
              )}
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-400">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-400">No users found.</td></tr>
              ) : (
                users.map((user) => {
                  const isEditing = editingId === user.id;
                  if (isEditing) {
                    return (
                      <tr key={user.id} className="bg-slate-50">
                        <td className="p-3">
                          <input className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </td>
                        <td className="p-3 text-xs text-slate-500">{user.email}</td>
                        <td className="p-3"><RoleSelect value={formData.role} onChange={(v) => setFormData({ ...formData, role: v })} /></td>
                        <td className="p-3">
                          <input className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500" placeholder="Reset password..." value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                          <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} /> Active</label>
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleUpdate(user.id)} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-100"><Check className="h-4 w-4" /></button>
                          <button onClick={cancelEdit} className="rounded p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="p-4 text-xs font-medium text-slate-900">{user.name}</td>
                      <td className="p-4 text-xs text-slate-600">{user.email}</td>
                      <td className="p-4">{roleBadge(user.role)}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.active ? "text-emerald-600" : "text-red-500"}`}>
                          {user.active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                          {user.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(user)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(user.id, user.name)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    );
  }

  function MasterDataSection() {
    const [recruiterModal, setRecruiterModal] = useState<{ mode: "add" | "edit"; id?: string } | null>(null);
    const [clientModal, setClientModal] = useState<{ mode: "add" | "edit"; id?: string } | null>(null);
    const [spocModal, setSpocModal] = useState<{ mode: "add" | "edit"; clientId: string; spocId?: string } | null>(null);
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [recruiterForm, setRecruiterForm] = useState({ name: "", email: "", designation: "", vertical: "", target: 0, contactNo: "", birthday: "", active: true, canEdit: true });
    const [clientForm, setClientForm] = useState({ name: "", industry: "", ownerRecruiterId: "" });
    const [spocForm, setSpocForm] = useState({ name: "", email: "", recruiterId: "" });

    const filteredRecruiters = searchQuery
      ? state.recruiters.filter((r) => {
          const q = searchQuery.toLowerCase();
          return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
        })
      : state.recruiters;

    const openRecruiterAdd = () => {
      setRecruiterForm({ name: "", email: "", designation: "", vertical: "", target: 0, contactNo: "", birthday: "", active: true, canEdit: true });
      setRecruiterModal({ mode: "add" });
    };
    const openRecruiterEdit = (r: Recruiter) => {
      setRecruiterForm({ name: r.name, email: r.email, designation: r.designation ?? "", vertical: r.vertical, target: r.target, contactNo: r.contactNo ?? "", birthday: r.birthday ?? "", active: r.active, canEdit: r.canEdit });
      setRecruiterModal({ mode: "edit", id: r.id });
    };
    const saveRecruiter = () => {
      if (!recruiterForm.name.trim() || !recruiterForm.email.trim()) { toast.error("Name and email are required"); return; }
      const payload = { ...recruiterForm, designation: recruiterForm.designation || undefined, contactNo: recruiterForm.contactNo || undefined, birthday: recruiterForm.birthday || undefined };
      if (recruiterModal?.mode === "add") {
        addRecruiter(payload);
        toast.success("Recruiter added");
      } else if (recruiterModal?.id) {
        updateRecruiter(recruiterModal.id, payload);
        toast.success("Recruiter updated");
      }
      setRecruiterModal(null);
    };
    const confirmDeleteRecruiter = (id: string, name: string) => {
      if (confirm(`Delete ${name}? Their dependent records will be removed.`)) {
        deleteRecruiter(id);
        toast.success("Recruiter deleted");
      }
    };

    const openClientAdd = () => {
      setClientForm({ name: "", industry: "", ownerRecruiterId: state.recruiters[0]?.id ?? "" });
      setClientModal({ mode: "add" });
    };
    const openClientEdit = (c: Client) => {
      setClientForm({ name: c.name, industry: c.industry, ownerRecruiterId: c.ownerRecruiterId });
      setClientModal({ mode: "edit", id: c.id });
    };
    const saveClient = () => {
      if (!clientForm.name.trim()) { toast.error("Client name is required"); return; }
      if (clientModal?.mode === "add") {
        const newId = createPrefixedId("client");
        addClient(clientForm, newId);
        setExpandedClient(newId);
        toast.success("Client added. Add SPOCs below.");
      } else if (clientModal?.id) {
        updateClient(clientModal.id, clientForm);
        toast.success("Client updated");
      }
      setClientModal(null);
    };
    const confirmDeleteClient = (id: string, name: string) => {
      if (confirm(`Delete ${name}? All related records will be removed.`)) {
        deleteClient(id);
        setExpandedClient(null);
        toast.success("Client deleted");
      }
    };

    const openSpocAdd = (clientId: string) => {
      setSpocForm({ name: "", email: "", recruiterId: state.recruiters[0]?.id ?? "" });
      setSpocModal({ mode: "add", clientId });
    };
    const openSpocEdit = (sp: ClientSpoc) => {
      setSpocForm({ name: sp.name, email: sp.email, recruiterId: sp.recruiterId });
      setSpocModal({ mode: "edit", clientId: sp.clientId, spocId: sp.id });
    };
    const saveSpoc = () => {
      if (!spocForm.name.trim()) { toast.error("SPOC name is required"); return; }
      if (spocModal?.mode === "add") {
        addSpoc({ ...spocForm, clientId: spocModal.clientId });
        toast.success("SPOC added");
      } else if (spocModal?.spocId) {
        updateSpoc(spocModal.spocId, { ...spocForm, clientId: spocModal.clientId });
        toast.success("SPOC updated");
      }
      setSpocModal(null);
    };
    const confirmDeleteSpoc = (id: string, name: string) => {
      if (confirm(`Delete SPOC ${name}?`)) {
        deleteSpoc(id);
        toast.success("SPOC deleted");
      }
    };

    return (
      <>
        <div className="space-y-6">
          <Panel variant="frosted">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold text-slate-700">Recruiters</p>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-7 w-44 rounded-lg border border-slate-200 pl-7 pr-2.5 text-[11px] outline-none focus:border-slate-400" />
                </div>
                <button onClick={openRecruiterAdd} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800"><Plus className="h-3.5 w-3.5" /> Add</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Email</th>
                    <th className="px-4 py-2 font-medium">Designation</th>
                    <th className="px-4 py-2 font-medium">Vertical</th>
                    <th className="px-4 py-2 font-medium text-right">Target</th>
                    <th className="px-4 py-2 font-medium text-center">Active</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecruiters.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{r.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.email}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.designation || "\u2014"}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.vertical}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-slate-700">{r.target}</td>
                      <td className="px-4 py-2.5 text-center">{r.active ? <Power className="inline h-3.5 w-3.5 text-emerald-500" /> : <PowerOff className="inline h-3.5 w-3.5 text-slate-300" />}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openRecruiterEdit(r)} className="rounded p-1 text-slate-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => confirmDeleteRecruiter(r.id, r.name)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel variant="frosted">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-semibold text-slate-700">Clients &amp; SPOCs</p>
              <button onClick={openClientAdd} className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800"><Plus className="h-3.5 w-3.5" /> Add Client</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium">Industry</th>
                    <th className="px-4 py-2 font-medium">Owner</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.clients.map((c) => {
                    const owner = state.recruiters.find((r) => r.id === c.ownerRecruiterId);
                    const spocs = state.spocs.filter((s) => s.clientId === c.id);
                    const isExpanded = expandedClient === c.id;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <button onClick={() => setExpandedClient(isExpanded ? null : c.id)} className="flex items-center gap-1.5 font-medium text-slate-900 hover:text-blue-600">
                            {spocs.length > 0 ? (isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />) : <span className="w-3" />}
                            {c.name}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{c.industry}</td>
                        <td className="px-4 py-2.5 text-slate-500">{owner?.name || "\u2014"}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openClientEdit(c)} className="rounded p-1 text-slate-400 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => confirmDeleteClient(c.id, c.name)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {state.clients.length === 0 && <p className="p-4 text-center text-xs text-slate-400">No clients yet.</p>}
          </Panel>

          {expandedClient && (
            <div className="-mt-4 ml-6 rounded-[28px] border border-slate-200/60 bg-slate-50/80 p-3 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">
                  SPOCs for <span className="text-slate-800">{state.clients.find((c) => c.id === expandedClient)?.name}</span>
                </p>
                <button onClick={() => openSpocAdd(expandedClient)} className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50"><Plus className="h-3 w-3" /> Add SPOC</button>
              </div>
              <table className="w-full text-xs">
                <thead className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                  <tr><th className="px-2 py-1 font-medium">Name</th><th className="px-2 py-1 font-medium">Email</th><th className="px-2 py-1 font-medium">Assigned To</th><th className="px-2 py-1 font-medium text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {state.spocs.filter((s) => s.clientId === expandedClient).map((sp) => {
                    const assigned = state.recruiters.find((r) => r.id === sp.recruiterId);
                    return (
                      <tr key={sp.id} className="hover:bg-white">
                        <td className="px-2 py-1.5 text-slate-700">{sp.name}</td>
                        <td className="px-2 py-1.5 text-slate-500">{sp.email}</td>
                        <td className="px-2 py-1.5 text-slate-500">{assigned?.name || "\u2014"}</td>
                        <td className="px-2 py-1.5 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openSpocEdit(sp)} className="rounded p-1 text-slate-400 hover:text-blue-600"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => confirmDeleteSpoc(sp.id, sp.name)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {state.spocs.filter((s) => s.clientId === expandedClient).length === 0 && (
                    <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-400">No SPOCs for this client.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {recruiterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setRecruiterModal(null)}>
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl bg-violet-100 p-2">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{recruiterModal.mode === "add" ? "Add Recruiter" : "Edit Recruiter"}</p>
                  <p className="text-xs text-slate-400">Configure profile, target, and permissions</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Full Name *" value={recruiterForm.name} onChange={(v) => setRecruiterForm({ ...recruiterForm, name: v })} />
                  <Input label="Email *" value={recruiterForm.email} onChange={(v) => setRecruiterForm({ ...recruiterForm, email: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Designation" value={recruiterForm.designation} onChange={(v) => setRecruiterForm({ ...recruiterForm, designation: v })} />
                  <Input label="Vertical" value={recruiterForm.vertical} onChange={(v) => setRecruiterForm({ ...recruiterForm, vertical: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">Monthly Target</label>
                    <input type="number" value={String(recruiterForm.target)} onChange={(e) => setRecruiterForm({ ...recruiterForm, target: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400" />
                    <p className="mt-0.5 text-[9px] text-slate-400">Number of joins expected per month</p>
                  </div>
                  <Input label="Contact No" value={recruiterForm.contactNo} onChange={(v) => setRecruiterForm({ ...recruiterForm, contactNo: v })} />
                </div>
                <Input label="Birthday" type="date" value={recruiterForm.birthday} onChange={(v) => setRecruiterForm({ ...recruiterForm, birthday: v })} />
                <div className="flex gap-6 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={recruiterForm.active} onChange={(e) => setRecruiterForm({ ...recruiterForm, active: e.target.checked })} className="rounded" /> Active</label>
                  <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={recruiterForm.canEdit} onChange={(e) => setRecruiterForm({ ...recruiterForm, canEdit: e.target.checked })} className="rounded" /> Can Edit</label>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" size="sm" onClick={() => setRecruiterModal(null)}>Cancel</Button>
                <Button size="sm" onClick={saveRecruiter} className="bg-slate-900 text-white hover:bg-slate-800">{recruiterModal.mode === "add" ? "Add Recruiter" : "Save Changes"}</Button>
              </div>
            </div>
          </div>
        )}
        {clientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setClientModal(null)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl bg-blue-100 p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{clientModal.mode === "add" ? "Add Client" : "Edit Client"}</p>
                  <p className="text-xs text-slate-400">Client company details</p>
                </div>
              </div>
              <div className="space-y-3">
                <Input label="Client Name *" value={clientForm.name} onChange={(v) => setClientForm({ ...clientForm, name: v })} />
                <Input label="Industry" value={clientForm.industry} onChange={(v) => setClientForm({ ...clientForm, industry: v })} />
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Owner Recruiter</label>
                  <select value={clientForm.ownerRecruiterId} onChange={(e) => setClientForm({ ...clientForm, ownerRecruiterId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400">
                    {state.recruiters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" size="sm" onClick={() => setClientModal(null)}>Cancel</Button>
                <Button size="sm" onClick={saveClient} className="bg-slate-900 text-white hover:bg-slate-800">{clientModal.mode === "add" ? "Add Client" : "Save Changes"}</Button>
              </div>
            </div>
          </div>
        )}
        {spocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSpocModal(null)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className="rounded-xl bg-emerald-100 p-2">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{spocModal.mode === "add" ? "Add SPOC" : "Edit SPOC"}</p>
                  <p className="text-xs text-slate-400">Client point of contact</p>
                </div>
              </div>
              <div className="space-y-3">
                <Input label="SPOC Name *" value={spocForm.name} onChange={(v) => setSpocForm({ ...spocForm, name: v })} />
                <Input label="Email" value={spocForm.email} onChange={(v) => setSpocForm({ ...spocForm, email: v })} />
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">Assigned Recruiter</label>
                  <select value={spocForm.recruiterId} onChange={(e) => setSpocForm({ ...spocForm, recruiterId: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-slate-400">
                    {state.recruiters.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" size="sm" onClick={() => setSpocModal(null)}>Cancel</Button>
                <Button size="sm" onClick={saveSpoc} className="bg-slate-900 text-white hover:bg-slate-800">{spocModal.mode === "add" ? "Add SPOC" : "Save Changes"}</Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  function ActivityLogSection() {
    const [actorFilter, setActorFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const filtered = (() => {
      let log = state.activityLog;
      if (actorFilter) {
        const q = actorFilter.toLowerCase();
        log = log.filter((l) => l.actorName.toLowerCase().includes(q));
      }
      if (typeFilter) log = log.filter((l) => l.entityType === typeFilter);
      if (dateFrom) log = log.filter((l) => l.timestamp.slice(0, 10) >= dateFrom);
      if (dateTo) log = log.filter((l) => l.timestamp.slice(0, 10) <= dateTo);
      return log;
    })();

    const entityTypes = Array.from(new Set(state.activityLog.map((l) => l.entityType)));

    return (
      <div className="space-y-4">
        <Panel variant="frosted" className="flex flex-wrap items-center gap-3 p-3">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Filter by actor..." value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-xs outline-none focus:border-slate-400" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-slate-400">
            <option value="">All types</option>
            {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-slate-400" />
          <span className="text-[10px] text-slate-400">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-slate-400" />
          <span className="text-[10px] text-slate-400">{filtered.length} entries</span>
        </Panel>
        <Panel variant="frosted" className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Timestamp</th>
                <th className="px-4 py-2.5 font-medium">Actor</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Entity</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-slate-800">{l.actorName}</td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{l.action}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600">{l.entityType}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-[10px] text-slate-500">{l.entityId}</td>
                  <td className="px-4 py-2 text-slate-600">{l.description}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No activity log entries.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>
    </div>
    );
  }
}
