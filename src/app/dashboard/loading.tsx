export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
          <div className="h-7 w-56 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-80 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[28px] border border-slate-200/60 bg-white/90 p-5 shadow-sm">
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 h-10 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-[28px] border border-slate-200/60 bg-white/90 p-5 shadow-sm">
          <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-28 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-7 flex-1 animate-pulse rounded-lg bg-slate-100" />
                  <div className="h-7 w-16 animate-pulse rounded-lg bg-slate-100" />
                </div>
                <div className="ml-32 mr-[4.5rem] h-px bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200/60 bg-white/90 p-5 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-10 animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/60 bg-white/90 p-5 shadow-sm">
            <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-3 w-12 animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
