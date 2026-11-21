"use client";

import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import type { DashboardAnalyticsQuery } from "@monorepo/graphql-contracts";

type Point = DashboardAnalyticsQuery["dashboardAnalytics"]["trend"][number];

export const TrendChart = memo(function TrendChart({
  points,
}: {
  points: Point[];
}) {
  return (
    <div
      className="h-64 w-full"
      role="img"
      aria-label="Daily total, successful, and failed executions"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
        >
          <defs>
            <linearGradient id="trend-total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="trend-success" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#e9eef5"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => value.slice(5)}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            minTickGap={18}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#8b5cf6"
            fill="url(#trend-total)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="succeeded"
            name="Succeeded"
            stroke="#3b82f6"
            fill="url(#trend-success)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="failed"
            name="Failed"
            stroke="#fb5b75"
            fill="none"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
