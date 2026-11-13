import { SQSClient } from '@aws-sdk/client-sqs';
import { Global, Module } from '@nestjs/common';

export const SQS_CLIENT = Symbol('SQS_CLIENT');

const sqsClientProvider = {
  provide: SQS_CLIENT,
  useFactory: (): SQSClient =>
    new SQSClient({ region: process.env.AWS_REGION ?? 'us-east-1' }),
};

@Global()
@Module({
  providers: [sqsClientProvider],
  exports: [SQS_CLIENT],
})
export class SqsModule {}
