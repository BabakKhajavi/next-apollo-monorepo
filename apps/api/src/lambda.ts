import { ApolloServer } from '@apollo/server';
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from '@as-integrations/aws-lambda';
import { NestFactory } from '@nestjs/core';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context,
} from 'aws-lambda';
import { AppModule } from './app.module.js';

// Built once per warm container: boot Nest only to resolve the schema via
// DI, then hand it to a bare @apollo/server instance for the hot path —
// no Nest HTTP adapter / Express in the Lambda request lifecycle.
const handlerPromise = (async () => {
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const { schema } = appContext.get(GraphQLSchemaHost);
  const server = new ApolloServer({ schema });

  // @apollo/server ships separate ESM/CJS type declarations; under
  // `nodenext` this file resolves the ESM one while @as-integrations/
  // aws-lambda (no "type" field, defaults CJS) resolves the CJS one for
  // its own `ApolloServer` param. Same class at runtime, two nominally
  // incompatible types at compile time — known dual-package hazard.
  return startServerAndCreateLambdaHandler(
    server as unknown as Parameters<typeof startServerAndCreateLambdaHandler>[0],
    handlers.createAPIGatewayProxyEventV2RequestHandler(),
  );
})();

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback<APIGatewayProxyStructuredResultV2>,
) => {
  const graphqlHandler = await handlerPromise;
  return graphqlHandler(event, context, callback);
};
