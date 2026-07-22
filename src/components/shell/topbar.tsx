"use client";

import Link from "next/link";
import { LogOut, UserRound, CalendarDays } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

function formatDate(date: Date): { dayName: string; day: string; month: string; year: number } {
  return {
    dayName: date.toLocaleDateString("en-GB", { weekday: "short" }),
    day: date.toLocaleDateString("en-GB", { day: "numeric" }),
    month: date.toLocaleDateString("en-GB", { month: "short" }),
    year: date.getFullYear(),
  };
}

export function Topbar() {
  const { state } = useApp();
  const { session, logout } = useAuth();

  if (!state) return null;

  const isAdmin = session?.role === "admin";
  const displayName = session?.name ?? state.currentUserName;
  const today = formatDate(new Date());

  function handleLogout() {
    logout();
  }

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
        {/* Left — company name + date */}
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-[#7f1d1d] text-3xl leading-tight tracking-wide">
            Huntsmen &amp; Barons
          </h1>
          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          <div className="hidden items-center gap-2 sm:flex">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            <time className="text-xs font-medium text-slate-500">
              {today.dayName}, {today.day} {today.month} {today.year}
            </time>
          </div>
        </div>

        {/* Right — user info + logout */}
        <div className="flex items-center gap-3">
          {/* User badge — link to profile */}
          <Link href="/dashboard/recruiter-profile" className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50">
            <div className={`grid h-8 w-8 place-items-center rounded-full text-white shadow-sm ${isAdmin ? "bg-slate-900" : "bg-blue-600"}`}>
              <UserRound className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-950">{displayName}</p>
              <p className="text-[11px] leading-tight text-slate-400 capitalize">{session?.role ?? "recruiter"}</p>
            </div>
          </Link>

          {/* Logout */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            id="topbar-logout-btn"
            className="text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
