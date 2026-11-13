import { registerEnumType } from '@nestjs/graphql';

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

registerEnumType(ExecutionStatus, { name: 'ExecutionStatus' });
