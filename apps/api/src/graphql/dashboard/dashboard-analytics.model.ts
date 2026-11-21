import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExecutionTrendPoint {
  @Field(() => String)
  date: string;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  succeeded: number;

  @Field(() => Int)
  failed: number;
}

@ObjectType()
export class WorkflowPerformanceRow {
  @Field(() => String)
  workflowId: string;

  @Field(() => String)
  name: string;

  @Field(() => Int)
  executions: number;
}

@ObjectType()
export class DashboardAnalytics {
  @Field(() => [ExecutionTrendPoint])
  trend: ExecutionTrendPoint[];

  @Field(() => [WorkflowPerformanceRow])
  topWorkflows: WorkflowPerformanceRow[];
}
