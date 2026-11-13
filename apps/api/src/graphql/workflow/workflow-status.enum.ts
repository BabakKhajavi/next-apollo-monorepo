import { registerEnumType } from '@nestjs/graphql';

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

registerEnumType(WorkflowStatus, { name: 'WorkflowStatus' });
