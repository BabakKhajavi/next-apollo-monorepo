import Link from "next/link";
import { Bell, CircleHelp, Search } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f8fd] lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-7">
          <form
            action="/workflows"
            role="search"
            className="flex min-w-0 max-w-lg flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 focus-within:border-indigo-400"
          >
            <Search size={18} aria-hidden="true" />
            <input
              name="q"
              type="search"
              aria-label="Search workflows"
              placeholder="Search workflows..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
            />
          </form>
          <div className="flex items-center gap-4 text-slate-600">
            <Link
              href="/#activity"
              aria-label="Activity"
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <Bell size={20} />
            </Link>
            <Link
              href="/workflows"
              aria-label="Workflow help"
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <CircleHelp size={20} />
            </Link>
            <span
              aria-label="Workspace"
              className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
            >
              FP
            </span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
