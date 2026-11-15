import { SQSClient } from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';
import { SQS_CLIENT } from './sqs.tokens.js';
import { SqsService } from './sqs.service.js';

const sqsClientProvider = {
  provide: SQS_CLIENT,
  useFactory: (): SQSClient =>
    new SQSClient({ region: process.env.AWS_REGION ?? 'us-east-1' }),
};

// @Global so any feature module can inject SqsService without importing
// this module itself — same shape as DynamoDbModule.
@Global()
@Module({
  providers: [sqsClientProvider, SqsService],
  exports: [SQS_CLIENT, SqsService],
})
export class SqsModule {}
