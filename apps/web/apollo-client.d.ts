import { GraphQLCodegenDataMasking } from "@apollo/client/masking";

declare module "@apollo/client" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Apollo's documented module-augmentation pattern for opting into data masking; the empty body is intentional, not a mistake.
  export interface TypeOverrides extends GraphQLCodegenDataMasking.TypeOverrides {}
}
