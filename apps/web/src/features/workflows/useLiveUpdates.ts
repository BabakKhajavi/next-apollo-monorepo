"use client";

import { useApolloClient } from "@apollo/client/react";
import { useAppSyncEventsSubscription } from "@monorepo/apollo-client/realtime";
import {
  appSyncEventsClient,
  appSyncEventsEnabled,
  executionChannel,
  workflowChannel,
  type ExecutionUpdateEvent,
  type WorkflowUpdateEvent,
} from "./realtime";

/**
 * Patches the normalized Apollo cache directly instead of refetching —
 * every component reading this Workflow's `status`/`definition` fields
 * (WorkflowHeader's useSuspenseQuery, the workflows list if it's mounted)
 * re-renders automatically, no manual refresh.
 */
export function useWorkflowLiveUpdates(workflowId: string): void {
  const client = useApolloClient();

  useAppSyncEventsSubscription<WorkflowUpdateEvent>(
    appSyncEventsClient,
    appSyncEventsEnabled ? workflowChannel(workflowId) : null,
    (event) => {
      client.cache.modify({
        id: client.cache.identify({
          __typename: "Workflow",
          id: event.workflowId,
        }),
        fields: {
          status: () => event.status,
          ...(event.definition !== undefined && {
            definition: () => event.definition,
          }),
        },
      });
    },
  );
}

export function useExecutionLiveUpdates(executionId: string): void {
  const client = useApolloClient();

  useAppSyncEventsSubscription<ExecutionUpdateEvent>(
    appSyncEventsClient,
    appSyncEventsEnabled ? executionChannel(executionId) : null,
    (event) => {
      client.cache.modify({
        id: client.cache.identify({
          __typename: "Execution",
          id: event.executionId,
        }),
        fields: {
          status: () => event.status,
          ...(event.error !== undefined && { error: () => event.error }),
        },
      });
    },
  );
}
