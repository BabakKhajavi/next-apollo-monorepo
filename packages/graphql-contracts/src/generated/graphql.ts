import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: unknown; output: unknown; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: unknown; output: unknown; }
};

export type CreateWorkflowInput = {
  definition: Scalars['JSON']['input'];
  name: Scalars['String']['input'];
};

export type DashboardStats = {
  __typename: 'DashboardStats';
  executionsByStatus: Array<ExecutionStatusCount>;
  totalExecutions: Scalars['Int']['output'];
  totalWorkflows: Scalars['Int']['output'];
};

export type Execution = {
  __typename: 'Execution';
  createdAt: Scalars['DateTime']['output'];
  error: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  status: ExecutionStatus;
  updatedAt: Scalars['DateTime']['output'];
  workflowId: Scalars['ID']['output'];
};

export type ExecutionPage = {
  __typename: 'ExecutionPage';
  items: Array<Execution>;
  nextCursor: Maybe<Scalars['String']['output']>;
};

export enum ExecutionStatus {
  Failed = 'FAILED',
  Pending = 'PENDING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED'
}

export type ExecutionStatusCount = {
  __typename: 'ExecutionStatusCount';
  count: Scalars['Int']['output'];
  status: ExecutionStatus;
};

export type Mutation = {
  __typename: 'Mutation';
  approveWorkflow: Workflow;
  createWorkflow: Workflow;
  deleteWorkflow: Scalars['Boolean']['output'];
  generateWorkflow: Workflow;
};


export type MutationApproveWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateWorkflowArgs = {
  input: CreateWorkflowInput;
};


export type MutationDeleteWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type MutationGenerateWorkflowArgs = {
  prompt: Scalars['String']['input'];
};

export type Query = {
  __typename: 'Query';
  dashboardStats: DashboardStats;
  execution: Execution;
  executions: ExecutionPage;
  health: Scalars['String']['output'];
  workflow: Workflow;
  workflows: WorkflowPage;
};


export type QueryExecutionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryExecutionsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: Scalars['Int']['input'];
  workflowId: Scalars['ID']['input'];
};


export type QueryWorkflowArgs = {
  id: Scalars['ID']['input'];
};


export type QueryWorkflowsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: Scalars['Int']['input'];
};

export type Workflow = {
  __typename: 'Workflow';
  createdAt: Scalars['DateTime']['output'];
  definition: Scalars['JSON']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  status: WorkflowStatus;
  updatedAt: Scalars['DateTime']['output'];
};

export type WorkflowPage = {
  __typename: 'WorkflowPage';
  items: Array<Workflow>;
  nextCursor: Maybe<Scalars['String']['output']>;
};

export enum WorkflowStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  Generating = 'GENERATING',
  GenerationFailed = 'GENERATION_FAILED',
  PendingApproval = 'PENDING_APPROVAL'
}

export type HealthQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthQuery = { health: string };

export type WorkflowsQueryVariables = Exact<{ [key: string]: never; }>;


export type WorkflowsQuery = { workflows: { __typename: 'WorkflowPage', nextCursor: string | null, items: Array<{ __typename: 'Workflow', id: string, name: string, status: WorkflowStatus }> } };


export const HealthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Health"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"health"}}]}}]} as unknown as DocumentNode<HealthQuery, HealthQueryVariables>;
export const WorkflowsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Workflows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workflows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]} as unknown as DocumentNode<WorkflowsQuery, WorkflowsQueryVariables>;