import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ExecutionStatusCount } from './execution-status-count.model.js';

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  totalWorkflows: number;

  @Field(() => Int)
  totalExecutions: number;

  @Field(() => [ExecutionStatusCount])
  executionsByStatus: ExecutionStatusCount[];
}
