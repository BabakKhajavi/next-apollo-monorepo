import Link from "next/link";
import { Suspense } from "react";
import { Panel, Skeleton } from "@monorepo/design-system";
import {
  RecentExecutionsDocument,
  type ExecutionStatus,
} from "@monorepo/graphql-contracts";
import { PreloadQuery } from "@/lib/apollo-rsc";
import { recentExecutions } from "@/features/executions/data/queries";
import { RecentExecutionsTable } from "@/features/executions/RecentExecutionsTable";
import { ApolloProvider } from "@/providers/ApolloProvider";

export const dynamic = "force-dynamic";
const allowed = new Set(["PENDING", "RUNNING", "SUCCEEDED", "FAILED"]);

export default async function ExecutionsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; status?: string; after?: string }>;
}) {
  const params = await searchParams;
  const requestedDays = Number(params.days ?? 30);
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const status =
    params.status && allowed.has(params.status)
      ? (params.status as ExecutionStatus)
      : undefined;
  const after = params.after;
  const page = await recentExecutions(25, days, after, status);
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-7">
      <header className="mb-6">
        <p className="mb-2 text-sm font-medium text-indigo-600">Workspace</p>
        <h1 className="text-3xl font-bold text-slate-950">Executions</h1>
        <p className="mt-1 text-sm text-slate-600">
          Recent workflow runs, newest first.
        </p>
      </header>
      <form
        action="/executions"
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <label htmlFor="execution-days" className="sr-only">
          Date range
        </label>
        <select
          id="execution-days"
          name="days"
          defaultValue={days}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <label htmlFor="execution-status" className="sr-only">
          Status
        </label>
        <select
          id="execution-status"
          name="status"
          defaultValue={status ?? ""}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {["PENDING", "RUNNING", "SUCCEEDED", "FAILED"].map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Apply filters
        </button>
      </form>
      <ApolloProvider>
        <Panel title="Recent Executions">
          <PreloadQuery
            query={RecentExecutionsDocument}
            variables={{ first: 25, days, after, status }}
          >
            <Suspense fallback={<Skeleton className="h-72" />}>
              <RecentExecutionsTable
                first={25}
                days={days}
                after={after}
                status={status}
              />
            </Suspense>
          </PreloadQuery>
        </Panel>
      </ApolloProvider>
      {page.nextCursor && (
        <div className="mt-5 flex justify-end">
          <Link
            href={`/executions?${new URLSearchParams({ days: String(days), ...(status ? { status } : {}), after: page.nextCursor })}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Next page →
          </Link>
        </div>
      )}
    </main>
  );
}
