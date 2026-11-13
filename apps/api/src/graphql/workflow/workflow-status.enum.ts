import { registerEnumType } from '@nestjs/graphql';

export enum WorkflowStatus {
  GENERATING = 'GENERATING',
  GENERATION_FAILED = 'GENERATION_FAILED',
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(WorkflowStatus, { name: 'WorkflowStatus' });
