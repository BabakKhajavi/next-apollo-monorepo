import { SendMessageCommand, type SQSClient } from '@aws-sdk/client-sqs';
import { Inject, Injectable } from '@nestjs/common';
import { SQS_CLIENT } from './sqs.module.js';

@Injectable()
export class SqsService {
  constructor(@Inject(SQS_CLIENT) private readonly client: SQSClient) {}

  async sendMessage(queueUrl: string, body: unknown): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(body),
      }),
    );
  }
}
