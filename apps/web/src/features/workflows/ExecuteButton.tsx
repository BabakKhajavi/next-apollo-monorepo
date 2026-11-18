"use client";

import { useMutation } from "@apollo/client/react";
import { Button } from "@monorepo/design-system";
import { ExecuteWorkflowDocument, ExecutionsDocument } from "@monorepo/graphql-contracts";

/**
 * One refetch, not polling: a brand-new Execution isn't yet in the
 * ExecutionsList's cached page, so it needs exactly one fetch to appear.
 * After that, ExecutionsList's own live-update subscription (set up once
 * the item renders) carries every further status change via push, not
 * further fetches.
 */
export function ExecuteButton({ workflowId }: { workflowId: string }) {
  const [executeWorkflow, { loading, error }] = useMutation(ExecuteWorkflowDocument, {
    refetchQueries: [{ query: ExecutionsDocument, variables: { workflowId, first: 10 } }],
  });

  return (
    <div className="flex items-center gap-3">
      <Button disabled={loading} onClick={() => executeWorkflow({ variables: { workflowId } })}>
        {loading ? "Starting…" : "Execute"}
      </Button>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
