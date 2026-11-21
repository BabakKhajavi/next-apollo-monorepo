import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Paginated } from '../../common/paginated.js';
import { Execution } from './execution.model.js';
import { ExecutionService } from './execution.service.js';

// See workflow.resolver.ts: must call Paginated() eagerly at module scope.
export const ExecutionPage = Paginated(Execution);

@Resolver(() => Execution)
export class ExecutionResolver {
  constructor(private readonly executionService: ExecutionService) {}

  @Query(() => Execution)
  execution(@Args('id', { type: () => ID }) id: string): Promise<Execution> {
    return this.executionService.findById(id);
  }

  @Query(() => ExecutionPage)
  executions(
    @Args('workflowId', { type: () => ID }) workflowId: string,
    @Args('first', { type: () => Int, defaultValue: 20 }) first: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ) {
    return this.executionService.listByWorkflowId(workflowId, first, after);
  }

  @Mutation(() => Execution)
  executeWorkflow(
    @Args('workflowId', { type: () => ID }) workflowId: string,
  ): Promise<Execution> {
    return this.executionService.execute(workflowId);
  }
}
