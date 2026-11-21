"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChartNoAxesCombined,
  House,
  Workflow,
  Zap,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/executions", label: "Executions", icon: Activity },
  { href: "/#analytics", label: "Analytics", icon: ChartNoAxesCombined },
];

function Navigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="space-y-1.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : href === "/#analytics"
              ? false
              : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${active ? "bg-indigo-500 text-white shadow-lg shadow-indigo-900/20" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
          >
            <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col bg-[#172440] px-3 py-6 text-white lg:flex">
        <Link
          href="/"
          className="mb-14 flex items-center gap-3 px-3 text-xl font-bold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
            <Zap size={20} fill="currentColor" aria-hidden="true" />
          </span>
          FlowPilot
        </Link>
        <Navigation />
        <div className="mt-auto rounded-xl border border-white/10 bg-white/10 p-3">
          <p className="text-sm font-semibold">Workflow workspace</p>
          <p className="mt-1 text-xs text-slate-300">Automation overview</p>
        </div>
      </aside>
      <details className="group border-b border-slate-200 bg-[#172440] text-white lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 marker:hidden">
          <span className="flex items-center gap-2 text-lg font-bold">
            <Zap size={20} className="text-violet-400" />
            FlowPilot
          </span>
          <span className="text-sm text-slate-300 group-open:hidden">
            Menu ☰
          </span>
          <span className="hidden text-sm text-slate-300 group-open:inline">
            Close ✕
          </span>
        </summary>
        <div className="px-4 pb-4">
          <Navigation />
        </div>
      </details>
    </>
  );
}
