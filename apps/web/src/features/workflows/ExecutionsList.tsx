"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { Badge } from "@monorepo/design-system";
import { ExecutionsDocument, type ExecutionStatus } from "@monorepo/graphql-contracts";
import { executionStatusTone } from "./utils/status-tone";
import { useExecutionLiveUpdates } from "./hooks/useLiveUpdates";

/**
 * Rendered inside a <PreloadQuery> (see workflows/[id]/page.tsx) — data was
 * already fetched and streamed from the Server Component, so this
 * `useSuspenseQuery` call resolves instantly from the preloaded queryRef
 * instead of firing a second request from the browser.
 */
export function ExecutionsList({ workflowId }: { workflowId: string }) {
  const { data } = useSuspenseQuery(ExecutionsDocument, {
    variables: { workflowId, first: 10 },
  });

  if (data.executions.items.length === 0) {
    return <p className="rounded-lg border border-zinc-200 p-6 text-zinc-600">No executions yet.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
      {data.executions.items.map((execution) => (
        <ExecutionRow key={execution.id} id={execution.id} status={execution.status} error={execution.error} />
      ))}
    </ul>
  );
}

function ExecutionRow({
  id,
  status,
  error,
}: {
  id: string;
  status: ExecutionStatus;
  error: string | null;
}) {
  // Subscribes once per execution shown — live RUNNING -> SUCCEEDED/FAILED
  // transitions patch this row's own normalized cache entry directly,
  // same mechanism as WorkflowHeader's status updates.
  useExecutionLiveUpdates(id);

  return (
    <li className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="font-mono text-xs text-zinc-500">{id}</p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <Badge tone={executionStatusTone(status)}>{status}</Badge>
    </li>
  );
}
