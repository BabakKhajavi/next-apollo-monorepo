import { cache } from "react";
import {
  DashboardAnalyticsDocument,
  DashboardStatsDocument,
  RecentExecutionsDocument,
  type ExecutionStatus,
} from "@monorepo/graphql-contracts";
import { query } from "@/lib/apollo-rsc";

export const dashboardStats = cache(async () => {
  const { data } = await query({ query: DashboardStatsDocument });
  if (!data) throw new Error("Dashboard totals unavailable");
  return data.dashboardStats;
});

export const dashboardAnalytics = cache(async (days: number) => {
  const { data } = await query({
    query: DashboardAnalyticsDocument,
    variables: { days },
  });
  if (!data) throw new Error("Dashboard analytics unavailable");
  return data.dashboardAnalytics;
});

export const recentExecutions = cache(
  async (
    first: number,
    days: number,
    after?: string,
    status?: ExecutionStatus,
    workflowId?: string,
  ) => {
    const { data } = await query({
      query: RecentExecutionsDocument,
      variables: { first, days, after, status, workflowId },
    });
    if (!data) throw new Error("Recent executions unavailable");
    return data.recentExecutions;
  },
);
