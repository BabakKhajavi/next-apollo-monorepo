import { cache } from "react";
import { RecentExecutionsDocument, type ExecutionStatus } from "@monorepo/graphql-contracts";
import { query } from "@/lib/apollo-rsc";

export const recentExecutions = cache(
  async (
    first: number,
    days: number,
    after?: string,
    status?: ExecutionStatus,
    workflowId?: string,
  ) => {
    const { data } = await query({
      query: RecentExecutionsDocument,
      variables: { first, days, after, status, workflowId },
    });
    if (!data) throw new Error("Recent executions unavailable");
    return data.recentExecutions;
  },
);
