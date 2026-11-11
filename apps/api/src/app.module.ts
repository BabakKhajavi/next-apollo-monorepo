import { fileURLToPath } from 'node:url';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthResolver } from './graphql/health.resolver.js';
import { WorkflowResolver } from './graphql/workflow/workflow.resolver.js';

// SDL is generated on boot and shared with packages/graphql-contracts so
// GraphQL Code Generator can run against it without a live server.
const schemaOutputPath = fileURLToPath(
  new URL(
    '../../../packages/graphql-contracts/schema.graphql',
    import.meta.url,
  ),
);

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: schemaOutputPath,
      sortSchema: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, HealthResolver, WorkflowResolver],
})
export class AppModule {}
