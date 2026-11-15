import { Field, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@InputType()
export class CreateWorkflowInput {
  @Field(() => String)
  name: string;

  @Field(() => GraphQLJSON)
  definition: unknown;
}
