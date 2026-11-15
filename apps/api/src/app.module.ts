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
import { SqsModule } from './sqs/sqs.module.js';

// SDL is generated on boot and shared with packages/graphql-contracts so
// GraphQL Code Generator can run against it without a live server — but
// only in dev (`nest start`): in Lambda, /var/task is read-only and the
// bundled handler has no `import.meta.url` to resolve the path from, so
// autoSchemaFile falls back to in-memory generation (`true`) there.
const isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const schemaOutputPath = isLambda
  ? true
  : fileURLToPath(
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
    SqsModule,
    WorkflowModule,
    ExecutionModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, HealthResolver],
})
export class AppModule {}
