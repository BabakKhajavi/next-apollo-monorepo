import { Module } from '@nestjs/common';
import { SqsService } from '../../sqs/sqs.service.js';
import { WorkflowRepository } from './workflow.repository.js';
import { WorkflowResolver } from './workflow.resolver.js';
import { WorkflowService } from './workflow.service.js';

@Module({
  providers: [WorkflowResolver, WorkflowService, WorkflowRepository, SqsService],
  exports: [WorkflowService, WorkflowRepository],
})
export class WorkflowModule {}
