import { fileURLToPath } from 'node:url';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DynamoDbModule } from './dynamodb/dynamodb.module.js';
import { DashboardModule } from './graphql/dashboard/dashboard.module.js';
import { ExecutionModule } from './graphql/execution/execution.module.js';
import { HealthResolver } from './graphql/health.resolver.js';
import { WorkflowModule } from './graphql/workflow/workflow.module.js';

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
    DynamoDbModule,
    WorkflowModule,
    ExecutionModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, HealthResolver],
})
export class AppModule {}
