"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { DashboardAnalyticsQuery } from "@monorepo/graphql-contracts";

type Row =
  DashboardAnalyticsQuery["dashboardAnalytics"]["topWorkflows"][number];
const colors = ["#8061f5", "#49a5f8", "#49c47d", "#fbb04e", "#fb6f88"];

export const PerformanceChart = memo(function PerformanceChart({
  rows,
}: {
  rows: Row[];
}) {
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label="Most executed workflows"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="#edf1f7" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tickFormatter={(value: string) =>
              value.length > 16 ? `${value.slice(0, 15)}…` : value
            }
            tick={{ fontSize: 11, fill: "#334155" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Bar dataKey="executions" radius={[0, 6, 6, 0]} maxBarSize={24}>
            {rows.map((row, index) => (
              <Cell key={row.workflowId} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
