import type { BadgeTone } from "@monorepo/design-system";
import { ExecutionStatus, WorkflowStatus } from "@monorepo/graphql-contracts";

// Switching on the enum members themselves (not their string values) is
// what lets TypeScript prove exhaustiveness — comparing against the
// equivalent string literal ("ACTIVE") type-checks fine too, but doesn't
// let the compiler verify every case is handled.
export function workflowStatusTone(status: WorkflowStatus): BadgeTone {
  switch (status) {
    case WorkflowStatus.Active:
      return "success";
    case WorkflowStatus.Generating:
    case WorkflowStatus.PendingApproval:
      return "info";
    case WorkflowStatus.GenerationFailed:
      return "danger";
    case WorkflowStatus.Draft:
    case WorkflowStatus.Archived:
      return "neutral";
  }
}

export function executionStatusTone(status: ExecutionStatus): BadgeTone {
  switch (status) {
    case ExecutionStatus.Succeeded:
      return "success";
    case ExecutionStatus.Running:
    case ExecutionStatus.Pending:
      return "info";
    case ExecutionStatus.Failed:
      return "danger";
  }
}
