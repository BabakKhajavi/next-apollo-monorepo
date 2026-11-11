import { Query, Resolver } from '@nestjs/graphql';
import { Workflow } from './workflow.model.js';

@Resolver(() => Workflow)
export class WorkflowResolver {
  @Query(() => [Workflow])
  workflows(): Workflow[] {
    return [{ id: '1', name: 'Demo Workflow', status: 'draft' }];
  }
}
