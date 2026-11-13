import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';
// Named import, not default: graphql-type-json's CJS build exports its
// default via `exports["default"] = ...` (bracket notation), which Node's
// ESM/CJS interop (cjs-module-lexer) fails to statically detect, so a
// default import resolves to the whole module namespace instead.
import { GraphQLJSON } from 'graphql-type-json';
import { WorkflowStatus } from './workflow-status.enum.js';

@ObjectType()
export class Workflow {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => WorkflowStatus)
  status: WorkflowStatus;

  // AI-generated automation definition (triggers/actions) — Phase 3 owns
  // its actual shape; stored/returned as opaque JSON until then.
  @Field(() => GraphQLJSON)
  definition: unknown;

  // Date here, not string: GraphQLISODateTime's serializer calls
  // .toISOString() on the resolved value — DynamoDB stores the ISO
  // string form, repositories convert back to Date on the way out.
  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}
