"use client";

import { useMutation } from "@apollo/client/react";
import { Button } from "@monorepo/design-system";
import { ApproveWorkflowDocument } from "@monorepo/graphql-contracts";

/**
 * No manual refetch/refresh needed: the mutation response selects
 * `{ id, status }`, which Apollo normalizes into the same Workflow:id
 * cache entry WorkflowHeader's query reads — that query re-renders on its
 * own once the cache updates.
 */
export function ApproveButton({ workflowId }: { workflowId: string }) {
  const [approveWorkflow, { loading }] = useMutation(ApproveWorkflowDocument);

  return (
    <Button variant="secondary" disabled={loading} onClick={() => approveWorkflow({ variables: { id: workflowId } })}>
      {loading ? "Approving…" : "Approve"}
    </Button>
  );
}
