import { Activity, Check, Workflow, X } from "lucide-react";
import { MetricCard } from "@monorepo/design-system";
import { dashboardStats } from "./data/queries";

export async function KpiSection() {
  const { totalWorkflows, totalExecutions, executionsByStatus } =
    await dashboardStats();
  const counts = Object.fromEntries(
    executionsByStatus.map(({ status, count }) => [status, count]),
  );
  return (
    <section
      aria-label="Key performance indicators"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <MetricCard
        label="Total Workflows"
        value={totalWorkflows}
        tone="violet"
        icon={<Workflow size={24} />}
      />
      <MetricCard
        label="Total Executions"
        value={totalExecutions}
        tone="green"
        icon={<Activity size={24} />}
      />
      <MetricCard
        label="Successful Executions"
        value={counts.SUCCEEDED ?? 0}
        tone="blue"
        icon={<Check size={26} />}
      />
      <MetricCard
        label="Failed Executions"
        value={counts.FAILED ?? 0}
        tone="rose"
        icon={<X size={26} />}
      />
    </section>
  );
}
