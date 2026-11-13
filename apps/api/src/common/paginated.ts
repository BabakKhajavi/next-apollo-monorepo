import type { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';

// Nest's documented pattern for a generic GraphQL connection type:
// code-first has no native generics, so build one ObjectType per T.
export function Paginated<T>(itemType: Type<T>) {
  @ObjectType(`${itemType.name}Page`)
  abstract class PaginatedType {
    @Field(() => [itemType])
    items: T[];

    @Field(() => String, { nullable: true })
    nextCursor?: string;
  }

  return PaginatedType;
}
