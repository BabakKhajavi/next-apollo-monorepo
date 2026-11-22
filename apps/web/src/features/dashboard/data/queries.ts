import { cache } from "react";
import {
  DashboardAnalyticsDocument,
  DashboardStatsDocument,
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
