import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Global, Module } from '@nestjs/common';

export const DYNAMODB_DOCUMENT_CLIENT = Symbol('DYNAMODB_DOCUMENT_CLIENT');

// DynamoDB Local (docker-compose.yml) in dev; real DynamoDB (via IAM role,
// no explicit credentials) in Lambda — same client code either way.
const dynamoClientProvider = {
  provide: DYNAMODB_DOCUMENT_CLIENT,
  useFactory: (): DynamoDBDocumentClient => {
    const endpoint = process.env.DYNAMODB_ENDPOINT;
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      endpoint,
      // DynamoDB Local ignores credentials but the SDK still requires
      // some; real DynamoDB (no endpoint override) uses the Lambda IAM
      // role via the default credential chain instead.
      ...(endpoint && {
        credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
      }),
    });
    return DynamoDBDocumentClient.from(client);
  },
};

@Global()
@Module({
  providers: [dynamoClientProvider],
  exports: [DYNAMODB_DOCUMENT_CLIENT],
})
export class DynamoDbModule {}
