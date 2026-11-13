import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
import { ExecutionStatus } from './execution-status.enum.js';

@ObjectType()
export class Execution {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  workflowId: string;

  @Field(() => ExecutionStatus)
  status: ExecutionStatus;

  @Field({ nullable: true })
  error?: string;

  // Date, not string — see workflow.model.ts for why.
  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
