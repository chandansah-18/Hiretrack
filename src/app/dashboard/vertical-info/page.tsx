"use client";

import { useState, useMemo } from "react";
import { Cake, CalendarDays, Clock, Search, UserCheck } from "lucide-react";
import { Panel, PanelHeader, PanelTitle, PanelContent } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/providers/app-provider";
import { formatShortDate } from "@/lib/utils";

function getCurrentPayCycle() {
  const now = new Date();
  const day = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();

  let startYear: number, startMonth: number, endYear: number, endMonth: number, payrollMonth: string;

  if (day >= 20) {
    startYear = year;
    startMonth = month;
    endYear = month === 11 ? year + 1 : year;
    endMonth = month === 11 ? 0 : month + 1;
    payrollMonth = new Date(endYear, endMonth, 1).toLocaleString("default", { month: "long", year: "numeric" });
  } else {
    startYear = month === 0 ? year - 1 : year;
    startMonth = month === 0 ? 11 : month - 1;
    endYear = year;
    endMonth = month;
    payrollMonth = new Date(year, month, 1).toLocaleString("default", { month: "long", year: "numeric" });
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const startStr = `${startYear}-${pad(startMonth + 1)}-20`;
  const endStr = `${endYear}-${pad(endMonth + 1)}-20`;

  return {
    start: startStr,
    end: endStr,
    startLabel: formatShortDate(startStr),
    endLabel: formatShortDate(endStr),
    payrollMonth,
  };
}

export default function VerticalInfoPage() {
  const { state, markLeave } = useApp();
  const userRole = state.currentUserRole;
  const isManager = userRole === "admin" || userRole === "manager";

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const payCycle = useMemo(() => getCurrentPayCycle(), []);

  const filteredRecruiters = useMemo(() => {
    let list = state.recruiters;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    return list;
  }, [state.recruiters, search]);

  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    return state.recruiters
      .filter((r) => {
        if (!r.birthday) return false;
        const bd = new Date(r.birthday);
        return bd.getMonth() === currentMonth || bd.getMonth() === nextMonth;
      })
      .map((r) => ({
        ...r,
        birthdayLabel: r.birthday
          ? new Date(r.birthday).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "",
        daysUntil: r.birthday
          ? (() => {
              const bd = new Date(r.birthday);
              const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
              const diff = Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return diff >= 0 ? diff : 365 + diff;
            })()
          : 999,
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [state.recruiters]);

  const dayLeaves = useMemo(() => (state.leaves ?? []).filter((l) => l.date === selectedDate), [state.leaves, selectedDate]);

  const getLeaveForRecruiter = (recruiterId: string) => dayLeaves.find((l) => l.recruiterId === recruiterId);

  const cycleLeaves = useMemo(
    () => (state.leaves ?? []).filter((l) => l.date >= payCycle.start && l.date <= payCycle.end),
    [state.leaves, payCycle]
  );

  const getCycleSummary = (recruiterId: string) => {
    const records = cycleLeaves.filter((l) => l.recruiterId === recruiterId);
    return {
      leaves: records.filter((l) => l.type === "Leave").length,
      halfDays: records.filter((l) => l.type === "Half Day").length,
      absents: records.filter((l) => l.type === "Absent").length,
    };
  };

  const handleToggleLeave = (recruiterId: string) => {
    const current = getLeaveForRecruiter(recruiterId);
    if (!current) {
      markLeave(recruiterId, selectedDate, "Leave");
    } else if (current.type === "Leave") {
      markLeave(recruiterId, selectedDate, "Half Day");
    } else if (current.type === "Half Day") {
      markLeave(recruiterId, selectedDate, "Absent");
    } else {
      markLeave(recruiterId, selectedDate, null);
    }
  };

  return (
    <div className="space-y-6">
      <Panel variant="frosted" className="px-6 py-5">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="block h-5 w-1 rounded-full bg-slate-400" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Team</p>
            <h1 className="font-heading text-base font-semibold tracking-tight text-slate-900">Vertical Info</h1>
          </div>
        </div>
        <p className="text-xs text-slate-500">Noida team directory, birthdays, and leave management.</p>
      </Panel>

      <Panel variant="elevated" className="px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="font-medium">Pay Cycle:</span>
          <span>{payCycle.startLabel} &ndash; {payCycle.endLabel}</span>
          <span className="text-slate-300">|</span>
          <span>Payroll Month: <strong className="text-slate-800">{payCycle.payrollMonth}</strong></span>
        </div>
      </Panel>

      <Panel variant="solid">
        <PanelHeader>
          <PanelTitle className="flex items-center gap-2 text-xs">
            <Cake className="h-3.5 w-3.5 text-pink-500" />
            Upcoming Birthdays
          </PanelTitle>
        </PanelHeader>
        <PanelContent className="pb-4 pt-0">
          {upcomingBirthdays.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">No upcoming birthdays</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {upcomingBirthdays.slice(0, 8).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white px-3 py-2 shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-600">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{r.name}</p>
                    <p className="text-[10px] text-pink-500">{r.birthdayLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelContent>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <PanelTitle className="flex items-center gap-2 text-xs">
                <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                Team Directory
              </PanelTitle>
              <span className="text-xs text-slate-400">{filteredRecruiters.length} members</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-slate-400"
                />
              </div>

            </div>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-1 py-1.5 font-medium">Member</th>
                    <th className="px-1 py-1.5 font-medium">Designation</th>
                    <th className="px-1 py-1.5 font-medium">Birthday</th>
                    <th className="px-1 py-1.5 font-medium">Email</th>
                    <th className="px-1 py-1.5 font-medium">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecruiters.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="whitespace-nowrap px-1 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white shadow-sm">
                            {r.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-1 py-2">
                        {r.designation ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{r.designation}</span>
                        ) : (
                          <span className="text-slate-300">{"\u2014"}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-1 py-2 text-slate-500">
                        {r.birthday
                          ? new Date(r.birthday).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "\u2014"}
                      </td>
                      <td className="whitespace-nowrap px-1 py-2">
                        <a href={`mailto:${r.email}`} className="text-blue-600 hover:underline">{r.email}</a>
                      </td>
                      <td className="whitespace-nowrap px-1 py-2 text-slate-500">{r.contactNo || "\u2014"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelContent>
        </Panel>

        <Panel variant="solid">
          <PanelHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <PanelTitle className="flex items-center gap-2 text-xs">
                <CalendarDays className="h-3.5 w-3.5 text-emerald-500" />
                Leave Tracker
              </PanelTitle>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-7 rounded-md border border-slate-200 px-2 text-[11px] outline-none focus:border-emerald-400"
              />
            </div>
          </PanelHeader>
          <PanelContent className="px-4 pb-4 pt-0">
            <div className="mb-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-1.5">Recruiter</th>
                    <th className="px-3 py-1.5">Designation</th>
                    <th className="px-3 py-1.5 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRecruiters.map((r) => {
                    const leave = getLeaveForRecruiter(r.id);
                    return (
                      <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-3 py-1.5 font-medium text-slate-800">{r.name}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.designation || "—"}</td>
                        <td className="px-3 py-1.5 text-center">
                          {isManager ? (
                            <button
                              onClick={() => handleToggleLeave(r.id)}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all ${
                                !leave
                                  ? "border border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600"
                                  : leave.type === "Leave"
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    : leave.type === "Half Day"
                                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                      : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              {leave ? leave.type : "\u2014"}
                            </button>
                          ) : (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              !leave
                                ? "text-slate-300"
                                : leave.type === "Leave"
                                  ? "bg-blue-100 text-blue-700"
                                  : leave.type === "Half Day"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                            }`}>
                              {leave ? leave.type : "\u2014"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Cycle Summary ({payCycle.startLabel} &ndash; {payCycle.endLabel})
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-2 py-1.5">Recruiter</th>
                      <th className="px-2 py-1.5 text-right w-12">Leave</th>
                      <th className="px-2 py-1.5 text-right w-12">&frac12; Day</th>
                      <th className="px-2 py-1.5 text-right w-12">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRecruiters.map((r) => {
                      const summary = getCycleSummary(r.id);
                      return (
                        <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-2 py-1 font-medium text-slate-800">{r.name}</td>
                          <td className="px-2 py-1 text-right font-semibold text-blue-600">{summary.leaves}</td>
                          <td className="px-2 py-1 text-right font-semibold text-amber-600">{summary.halfDays}</td>
                          <td className="px-2 py-1 text-right font-semibold text-red-600">{summary.absents}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}
