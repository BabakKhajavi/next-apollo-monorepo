import Link from "next/link";
import { DashboardStatsDocument } from "@monorepo/graphql-contracts";
import { query } from "@/lib/apollo-rsc";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data } = await query({ query: DashboardStatsDocument });
  if (!data) throw new Error("The dashboard stats response was empty");

  const { totalWorkflows, totalExecutions, executionsByStatus } = data.dashboardStats;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm font-medium text-zinc-500">Workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-3 text-zinc-600">
          An AI-generated workflow automation platform.{" "}
          <Link href="/workflows" className="font-medium text-zinc-900 underline underline-offset-4">
            View all workflows →
          </Link>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total workflows" value={totalWorkflows} />
        <StatCard label="Total executions" value={totalExecutions} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">Executions by status</h2>
        {executionsByStatus.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 p-6 text-zinc-600">No executions yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {executionsByStatus.map(({ status, count }) => (
              <li key={status} className="rounded-lg border border-zinc-200 p-4">
                <p className="text-2xl font-semibold tabular-nums">{count}</p>
                <p className="mt-1 text-sm text-zinc-500">{status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-6">
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}
