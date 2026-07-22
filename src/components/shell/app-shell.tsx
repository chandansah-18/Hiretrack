"use client";

import { type ReactNode } from "react";
import { AppProvider, useApp } from "@/components/providers/app-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { PageTransition } from "./page-transition";
import { Button } from "@/components/ui/button";

function LoadStateBanners() {
  const { isLoading, loadError, refreshState, dataWindowMonths, can } = useApp();

  if (isLoading) {
    return (
      <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Loading dashboard data…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Could not load live data: <span className="font-medium">{loadError}</span>. Retrying automatically…
        </p>
        <Button size="sm" variant="outline" onClick={() => void refreshState()}>
          Retry now
        </Button>
      </div>
    );
  }

  if (!can("manage_users")) return null;

  return (
    <p className="mb-3 text-[11px] text-slate-400">
      Hot cache: last {dataWindowMonths} months. Use Admin → Storage &amp; Archive for backups and cleanup.
    </p>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col">
              <Topbar />
              <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">
                <LoadStateBanners />
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
