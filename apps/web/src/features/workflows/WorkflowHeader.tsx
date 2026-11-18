"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { Badge } from "@monorepo/design-system";
import { WorkflowDocument } from "@monorepo/graphql-contracts";
import { ApproveButton } from "./ApproveButton";
import { ExecuteButton } from "./ExecuteButton";
import { workflowStatusTone } from "./status-tone";
import { useWorkflowLiveUpdates } from "./useLiveUpdates";

/**
 * Owns the Workflow query itself (rather than taking server-fetched data
 * as a prop) so status changes pushed into the cache by
 * useWorkflowLiveUpdates — e.g. GENERATING -> DRAFT once ai-worker
 * finishes — are reflected here without a page refresh: useSuspenseQuery
 * re-renders whenever the cache entry it reads changes.
 */
export function WorkflowHeader({ id }: { id: string }) {
  const { data } = useSuspenseQuery(WorkflowDocument, { variables: { id } });
  useWorkflowLiveUpdates(id);

  const { workflow } = data;
  const canApprove = workflow.status === "DRAFT" || workflow.status === "PENDING_APPROVAL";
  const canExecute = workflow.status === "ACTIVE";

  return (
    <>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Workflow</p>
          <h1 className="text-3xl font-semibold tracking-tight">{workflow.name}</h1>
          <div className="mt-3">
            <Badge tone={workflowStatusTone(workflow.status)}>
              {workflow.status.replaceAll("_", " ")}
            </Badge>
          </div>
        </div>
        <div className="flex gap-3">
          {canApprove && <ApproveButton workflowId={workflow.id} />}
          {canExecute && <ExecuteButton workflowId={workflow.id} />}
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium text-zinc-500">Definition</h2>
        <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs">
          {JSON.stringify(workflow.definition, null, 2)}
        </pre>
      </section>
    </>
  );
}
