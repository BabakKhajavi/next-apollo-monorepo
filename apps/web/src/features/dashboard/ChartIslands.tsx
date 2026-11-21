"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@monorepo/design-system";
import type { DashboardAnalyticsQuery } from "@monorepo/graphql-contracts";

type Analytics = DashboardAnalyticsQuery["dashboardAnalytics"];

export const TrendChart = dynamic(
  () => import("./charts/TrendChart").then((module) => module.TrendChart),
  { ssr: false, loading: () => <Skeleton className="h-64" /> },
);
export const StatusChart = dynamic(
  () => import("./charts/StatusChart").then((module) => module.StatusChart),
  { ssr: false, loading: () => <Skeleton className="h-64" /> },
);
export const PerformanceChart = dynamic(
  () =>
    import("./charts/PerformanceChart").then(
      (module) => module.PerformanceChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-64" /> },
);

export type { Analytics };
