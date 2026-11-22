import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Bot, Workflow, Activity, PlugZap } from "lucide-react";
import { EmptyState, Panel, Skeleton } from "@monorepo/design-system";
import {
  RecentExecutionsDocument,
  type ExecutionStatus,
} from "@monorepo/graphql-contracts";
import { PreloadQuery } from "@/lib/apollo-rsc";
import { dashboardAnalytics, dashboardStats } from "./data/queries";
import { PerformanceChart, StatusChart, TrendChart } from "./ChartIslands";
import { RecentExecutionsTable } from "@/features/executions/RecentExecutionsTable";
import { recentExecutions } from "@/features/executions/data/queries";
import { ActivityFeed } from "./ActivityFeed";

export function SectionSkeleton({ title }: { title: string }) {
  return (
    <Panel title={title}>
      <Skeleton className="h-64" />
    </Panel>
  );
}

export async function TrendSection({ days }: { days: number }) {
  const analytics = await dashboardAnalytics(days);
  return (
    <Panel title="Execution Trend" className="min-w-0 xl:col-span-2">
      {analytics.trend.every((point) => point.total === 0) ? (
        <EmptyState
          title="No execution data"
          description="Trend appears once workflows run."
        />
      ) : (
        <TrendChart points={analytics.trend} />
      )}
    </Panel>
  );
}

export async function StatusSection() {
  const stats = await dashboardStats();
  return (
    <Panel title="Execution by Status" className="min-w-0">
      {stats.totalExecutions === 0 ? (
        <EmptyState title="No executions yet" />
      ) : (
        <StatusChart counts={stats.executionsByStatus} />
      )}
    </Panel>
  );
}

export async function PerformanceSection({ days }: { days: number }) {
  const analytics = await dashboardAnalytics(days);
  return (
    <Panel title="Workflow Performance" className="min-w-0">
      {analytics.topWorkflows.length === 0 ? (
        <EmptyState title="No workflow runs yet" />
      ) : (
        <PerformanceChart rows={analytics.topWorkflows} />
      )}
    </Panel>
  );
}

export function QuickActions() {
  const actions = [
    {
      href: "/workflows#generate",
      label: "Create Workflow",
      icon: Workflow,
      style: "bg-violet-50 text-violet-700 hover:bg-violet-100",
    },
    {
      href: "/workflows",
      label: "Browse Workflows",
      icon: Bot,
      style: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    },
    {
      href: "/executions",
      label: "Review Executions",
      icon: Activity,
      style: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    },
    {
      href: "/#activity",
      label: "Live Activity",
      icon: PlugZap,
      style: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    },
  ];
  return (
    <Panel title="Quick Actions" className="min-w-0">
      <div className="grid gap-2.5">
        {actions.map(({ href, label, icon: Icon, style }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${style}`}
          >
            <Icon size={20} aria-hidden="true" />
            {label}
            <ArrowRight className="ml-auto" size={16} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export function RecentSection({
  days,
  status,
}: {
  days: number;
  status?: ExecutionStatus;
}) {
  return (
    <Panel
      title="Recent Executions"
      className="min-w-0 xl:col-span-2"
      action={
        <Link
          href={`/executions?days=${days}`}
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          View all →
        </Link>
      }
    >
      <PreloadQuery
        query={RecentExecutionsDocument}
        variables={{ first: 8, days, status }}
      >
        <Suspense fallback={<Skeleton className="h-64" />}>
          <RecentExecutionsTable days={days} status={status} first={8} />
        </Suspense>
      </PreloadQuery>
    </Panel>
  );
}

export async function ActivitySection({ days }: { days: number }) {
  const data = await recentExecutions(5, days);
  const realtimeConfigured = Boolean(
    process.env.NEXT_PUBLIC_APPSYNC_EVENTS_HTTP_ENDPOINT &&
    process.env.NEXT_PUBLIC_APPSYNC_EVENTS_API_KEY,
  );
  return (
    <Panel
      title="Real-time Activity"
      className="min-w-0"
      action={
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${realtimeConfigured ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
        >
          {realtimeConfigured ? "● Updates enabled" : "Recent activity"}
        </span>
      }
    >
      <ActivityFeed initial={data.items} />
    </Panel>
  );
}
