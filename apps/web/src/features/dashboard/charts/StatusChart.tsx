"use client";

import { memo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors: Record<string, string> = {
  SUCCEEDED: "#40c878",
  FAILED: "#fb5b75",
  RUNNING: "#8b5cf6",
  PENDING: "#d5deea",
};
const labels: Record<string, string> = {
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
  RUNNING: "Running",
  PENDING: "Pending",
};

export const StatusChart = memo(function StatusChart({
  counts,
}: {
  counts: { status: string; count: number }[];
}) {
  const total = counts.reduce((sum, row) => sum + row.count, 0);
  const visible = counts.filter((row) => row.count > 0);
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div
        className="relative h-60"
        role="img"
        aria-label="Execution status distribution"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={
                visible.length ? visible : [{ status: "PENDING", count: 1 }]
              }
              dataKey="count"
              nameKey="status"
              innerRadius="64%"
              outerRadius="84%"
              stroke="none"
              paddingAngle={visible.length > 1 ? 2 : 0}
            >
              {(visible.length
                ? visible
                : [{ status: "PENDING", count: 1 }]
              ).map((row) => (
                <Cell key={row.status} fill={colors[row.status]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [value, labels[String(name)] ?? name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-2xl font-bold tabular-nums text-slate-950">
            {total.toLocaleString()}
          </strong>
          <span className="text-xs text-slate-500">Executions</span>
        </div>
      </div>
      <ul className="space-y-3 text-sm">
        {counts.map((row) => (
          <li key={row.status} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: colors[row.status] }}
            />
            <span className="flex-1 text-slate-700">
              {labels[row.status] ?? row.status}
            </span>
            <strong className="tabular-nums text-slate-950">
              {total ? `${((row.count / total) * 100).toFixed(1)}%` : "0%"}
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
});
