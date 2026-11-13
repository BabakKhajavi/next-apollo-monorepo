import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Paginated } from '../../common/paginated.js';
import { CreateWorkflowInput } from './create-workflow.input.js';
import { WorkflowStatus } from './workflow-status.enum.js';
import { Workflow } from './workflow.model.js';
import { WorkflowService } from './workflow.service.js';

// Decorates the generated class with @ObjectType() at module-load time —
// must happen eagerly, not lazily inside the @Query thunk below, or Nest's
// one-time lazy-metadata flush runs before this type registers itself.
const WorkflowPage = Paginated(Workflow);

@Resolver(() => Workflow)
export class WorkflowResolver {
  constructor(private readonly workflowService: WorkflowService) {}

  @Query(() => Workflow)
  workflow(@Args('id', { type: () => ID }) id: string): Promise<Workflow> {
    return this.workflowService.findById(id);
  }

  @Query(() => WorkflowPage)
  workflows(
    @Args('first', { type: () => Int, defaultValue: 20 }) first: number,
    @Args('after', { type: () => String, nullable: true }) after?: string,
  ) {
    return this.workflowService.list(first, after);
  }

  @Mutation(() => Workflow)
  generateWorkflow(@Args('prompt') prompt: string): Promise<Workflow> {
    return this.workflowService.generateFromPrompt(prompt);
  }

  @Mutation(() => Workflow)
  createWorkflow(
    @Args('input') input: CreateWorkflowInput,
  ): Promise<Workflow> {
    return this.workflowService.create(input);
  }

  @Mutation(() => Workflow)
  approveWorkflow(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Workflow> {
    return this.workflowService.updateStatus(id, WorkflowStatus.ACTIVE);
  }

  @Mutation(() => Boolean)
  deleteWorkflow(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.workflowService.delete(id);
  }
}
