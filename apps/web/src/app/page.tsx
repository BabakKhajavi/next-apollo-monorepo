import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { ApolloProvider } from "@/providers/ApolloProvider";
import { KpiSection } from "@/features/dashboard/KpiSection";
import { KpiSkeleton } from "@/features/dashboard/KpiSkeleton";
import {
  ActivitySection,
  PerformanceSection,
  QuickActions,
  RecentSection,
  SectionSkeleton,
  StatusSection,
  TrendSection,
} from "@/features/dashboard/Sections";

export const dynamic = "force-dynamic";
type SearchParams = Promise<{ days?: string }>;

async function selectedDays(searchParams: SearchParams): Promise<number> {
  const requested = Number((await searchParams).days ?? 30);
  return [7, 30, 90].includes(requested) ? requested : 30;
}

function CreateWorkflowLink() {
  return (
    <Link
      href="/workflows#generate"
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
    >
      <Plus size={18} />
      Create Workflow
    </Link>
  );
}

async function DateRangeControl({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const days = await selectedDays(searchParams);
  return (
    <div className="flex items-center gap-3">
      <form action="/" className="flex items-center gap-2">
        <label htmlFor="days" className="sr-only">
          Date range
        </label>
        <select
          id="days"
          name="days"
          defaultValue={days}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <button
          type="submit"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Apply
        </button>
      </form>
      <CreateWorkflowLink />
    </div>
  );
}

async function DashboardSections({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const days = await selectedDays(searchParams);
  return (
    <>
      <div id="analytics" className="mt-5 grid gap-4 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <Suspense fallback={<SectionSkeleton title="Execution Trend" />}>
            <TrendSection days={days} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<SectionSkeleton title="Execution by Status" />}>
            <StatusSection />
          </Suspense>
        </div>
        <QuickActions />
      </div>
      <ApolloProvider>
        <div className="mt-4 grid gap-4 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <Suspense fallback={<SectionSkeleton title="Recent Executions" />}>
              <RecentSection days={days} />
            </Suspense>
          </div>
          <div>
            <Suspense
              fallback={<SectionSkeleton title="Workflow Performance" />}
            >
              <PerformanceSection days={days} />
            </Suspense>
          </div>
          <div id="activity">
            <Suspense fallback={<SectionSkeleton title="Real-time Activity" />}>
              <ActivitySection days={days} />
            </Suspense>
          </div>
        </div>
      </ApolloProvider>
    </>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-[1560px] px-5 py-7 sm:px-7">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor workflows, executions, and performance.
          </p>
        </div>
        <Suspense fallback={<CreateWorkflowLink />}>
          <DateRangeControl searchParams={searchParams} />
        </Suspense>
      </header>
      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection />
      </Suspense>
      <Suspense
        fallback={
          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            <SectionSkeleton title="Execution Trend" />
            <SectionSkeleton title="Execution by Status" />
          </div>
        }
      >
        <DashboardSections searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
