import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Workflow {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  status: string;
}
