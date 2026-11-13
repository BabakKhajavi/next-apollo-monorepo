import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ExecutionStatus } from '../execution/execution-status.enum.js';

@ObjectType()
export class ExecutionStatusCount {
  @Field(() => ExecutionStatus)
  status: ExecutionStatus;

  @Field(() => Int)
  count: number;
}
