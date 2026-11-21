import {
  Field,
  GraphQLISODateTime,
  HideField,
  ID,
  ObjectType,
} from '@nestjs/graphql';
import { ExecutionStatus } from './execution-status.enum.js';

@ObjectType()
export class Execution {
  // Required for the global recent-executions GSI; not exposed in GraphQL.
  @HideField()
  activityType?: 'EXECUTION';
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  workflowId: string;

  @Field(() => String, { nullable: true })
  workflowName?: string;

  @Field(() => ExecutionStatus)
  status: ExecutionStatus;

  @Field(() => String, { nullable: true })
  error?: string;

  // Date, not string — see workflow.model.ts for why.
  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
