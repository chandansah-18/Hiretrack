"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  FileUp,
  Home,
  LayoutDashboard,
  Network,
  ScrollText,
  Settings2,
} from "lucide-react";

const navigation = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/positions", label: "Position", icon: BriefcaseBusiness },
  { href: "/dashboard/submissions", label: "Submission", icon: FileUp },
  { href: "/dashboard/interviews", label: "Interview", icon: ScrollText },
  { href: "/dashboard/final-selection", label: "Final Selects", icon: Network },
  { href: "/dashboard/selection", label: "Selections", icon: Building2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/dashboard/vertical-info", label: "Vertical Info", icon: BarChart3 },
  { href: "/dashboard/admin", label: "Admin", icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 z-40 flex h-screen w-[68px] shrink-0 flex-col border-r border-slate-200 bg-white self-start">
      {/* Logo */}
      <div className="grid min-h-[72px] place-items-center py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
          <LayoutDashboard className="h-5 w-5" />
        </div>
      </div>

      <div className="mx-4 border-t border-slate-100" />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group/item relative grid h-10 w-10 place-items-center rounded-lg transition-colors duration-150 hover:bg-slate-100 ${active ? "bg-slate-100" : ""}`}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-slate-900" />
              )}

              {/* Icon */}
              <Icon
                className={`h-[18px] w-[18px] transition-colors duration-150 ${active ? "text-slate-900" : "text-slate-500 group-hover/item:text-slate-700"}`}
              />

              {/* Tooltip label */}
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
