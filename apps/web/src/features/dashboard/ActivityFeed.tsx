"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Check, X } from "lucide-react";
import { useApolloClient } from "@apollo/client/react";
import { useAppSyncEventsSubscription } from "@monorepo/apollo-client/realtime";
import { EmptyState } from "@monorepo/design-system";
import type { RecentExecutionsQuery } from "@monorepo/graphql-contracts";
import {
  appSyncEventsClient,
  appSyncEventsEnabled,
  executionChannel,
  type ExecutionUpdateEvent,
} from "@/features/workflows/realtime";

type Execution = RecentExecutionsQuery["recentExecutions"]["items"][number];

function ActivityRow({ item }: { item: Execution }) {
  const client = useApolloClient();
  const [status, setStatus] = useState<string>(item.status);
  const [updatedAt, setUpdatedAt] = useState(String(item.updatedAt));
  useAppSyncEventsSubscription<ExecutionUpdateEvent>(
    appSyncEventsClient,
    appSyncEventsEnabled ? executionChannel(item.id) : null,
    (event) => {
      setStatus(event.status);
      setUpdatedAt(new Date().toISOString());
      client.cache.modify({
        id: client.cache.identify({ __typename: "Execution", id: item.id }),
        fields: {
          status: () => event.status,
          ...(event.error !== undefined ? { error: () => event.error } : {}),
        },
      });
    },
  );
  const Icon =
    status === "SUCCEEDED" ? Check : status === "FAILED" ? X : Activity;
  const tone =
    status === "SUCCEEDED"
      ? "bg-emerald-100 text-emerald-600"
      : status === "FAILED"
        ? "bg-rose-100 text-rose-600"
        : "bg-violet-100 text-violet-600";
  return (
    <li className="flex gap-3 text-sm">
      <span
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${tone}`}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-slate-800">
          <Link
            href={`/workflows/${item.workflowId}`}
            className="font-semibold hover:text-indigo-600"
          >
          {item.workflowName ?? `Workflow ${item.workflowId.slice(0, 8)}`}
          </Link>{" "}
          {status.toLowerCase()}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {new Date(updatedAt).toLocaleString("en-US", {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          UTC
        </p>
      </div>
    </li>
  );
}

export function ActivityFeed({ initial }: { initial: Execution[] }) {
  if (!initial.length)
    return (
      <EmptyState
        title="No recent activity"
        description="Execution updates appear here."
      />
    );
  return (
    <ol className="space-y-4">
      {initial.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </ol>
  );
}
