"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useSuspenseQuery } from "@apollo/client/react";
import { Badge, EmptyState } from "@monorepo/design-system";
import {
  RecentExecutionsDocument,
  type ExecutionStatus,
  type RecentExecutionsQuery,
} from "@monorepo/graphql-contracts";
import { executionStatusTone } from "@/features/workflows/utils/status-tone";
import { useExecutionLiveUpdates } from "@/features/workflows/hooks/useLiveUpdates";

type Execution = RecentExecutionsQuery["recentExecutions"]["items"][number];

function ExecutionRow({ row }: { row: Execution }) {
  useExecutionLiveUpdates(row.id);
  return (
    <tr className="hover:bg-slate-50">
      <td className="py-3 pr-4">
        <Link
          href={`/workflows/${row.workflowId}`}
          className="font-medium text-slate-900 hover:text-indigo-600"
        >
          {row.workflowName ?? `Workflow ${row.workflowId.slice(0, 8)}`}
        </Link>
        <span className="block font-mono text-xs text-slate-600">
          {row.id.slice(0, 12)}
        </span>
      </td>
      <td className="py-3 pr-4 whitespace-nowrap text-slate-600">
        {new Date(String(row.createdAt)).toLocaleString("en-US", {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        UTC
      </td>
      <td className="py-3 pr-4 tabular-nums text-slate-600">
        {Math.max(
          0,
          (Date.parse(String(row.updatedAt)) -
            Date.parse(String(row.createdAt))) /
            1000,
        ).toFixed(1)}
        s
      </td>
      <td className="py-3">
        <Badge tone={executionStatusTone(row.status)}>
          {row.status.toLowerCase()}
        </Badge>
      </td>
    </tr>
  );
}

type SortKey = "createdAt" | "workflowId" | "status" | "duration";

export function RecentExecutionsTable({
  days,
  first,
  after,
  status,
  workflowId,
}: {
  days: number;
  first: number;
  after?: string;
  status?: ExecutionStatus;
  workflowId?: string;
}) {
  const { data } = useSuspenseQuery(RecentExecutionsDocument, {
    variables: { days, first, after, status, workflowId },
  });
  const [sort, setSort] = useState<{ key: SortKey; direction: 1 | -1 }>({
    key: "createdAt",
    direction: -1,
  });
  const rows = useMemo(
    () =>
      [...data.recentExecutions.items].sort((a, b) => {
        const value = (row: typeof a) =>
          sort.key === "duration"
            ? Date.parse(String(row.updatedAt)) -
              Date.parse(String(row.createdAt))
            : String(row[sort.key]);
        const left = value(a);
        const right = value(b);
        return (left < right ? -1 : left > right ? 1 : 0) * sort.direction;
      }),
    [data.recentExecutions.items, sort],
  );

  function heading(key: SortKey, label: string) {
    return (
      <button
        type="button"
        onClick={() =>
          setSort((current) => ({
            key,
            direction:
              current.key === key ? (current.direction === 1 ? -1 : 1) : 1,
          }))
        }
        className="inline-flex items-center gap-1 text-left hover:text-indigo-600"
        aria-label={`Sort by ${label}`}
      >
        {label}
        {sort.key === key ? (
          sort.direction === 1 ? (
            <ArrowUp size={13} />
          ) : (
            <ArrowDown size={13} />
          )
        ) : null}
      </button>
    );
  }

  if (rows.length === 0)
    return (
      <EmptyState
        title="No executions found"
        description="Run a workflow or change the date range."
      />
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs text-slate-500">
          <tr>
            <th className="pb-3 font-semibold">
              {heading("workflowId", "Workflow")}
            </th>
            <th className="pb-3 font-semibold">
              {heading("createdAt", "Started")}
            </th>
            <th className="pb-3 font-semibold">
              {heading("duration", "Duration")}
            </th>
            <th className="pb-3 font-semibold">
              {heading("status", "Status")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <ExecutionRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-600">
        Column sorting applies to this page of results.
      </p>
    </div>
  );
}
