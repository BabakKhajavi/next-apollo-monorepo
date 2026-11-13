import { Module } from '@nestjs/common';
import { ExecutionRepository } from './execution.repository.js';
import { ExecutionResolver } from './execution.resolver.js';
import { ExecutionService } from './execution.service.js';

@Module({
  providers: [ExecutionResolver, ExecutionService, ExecutionRepository],
  exports: [ExecutionService, ExecutionRepository],
})
export class ExecutionModule {}
