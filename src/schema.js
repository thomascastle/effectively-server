const { gql } = require("apollo-server");

const typeDefs = gql`
  "-- Default types --"
  type Mutation {
    closeIssue(id: ID!): CloseIssueResponse

    closeMilestone(id: ID!): CloseMilestoneResponse

    createIssue(input: CreateIssueInput): CreateIssueResponse

    createLabel(input: CreateLabelInput): CreateLabelResponse

    createMilestone(input: CreateMilestoneInput): CreateMilestoneResponse

    createRepository(input: CreateRepositoryInput): CreateRepositoryPayload

    deleteIssue(id: ID!): DeleteIssueResponse

    deleteLabel(id: ID!): DeleteLabelResponse

    deleteMilestone(id: ID!): DeleteMilestoneResponse

    login(input: LogInInput): AuthPayload

    reopenMilestone(id: ID!): ReopenMilestoneResponse

    signup(input: SignUpInput): AuthPayload

    updateIssue(input: UpdateIssueInput): UpdateIssueResponse

    updateLabel(input: UpdateLabelInput): UpdateLabelResponse

    updateMilestone(input: UpdateMilestoneInput): UpdateMilestoneResponse
  }

  type Query {
    issue(number: Int!): Issue

    issues(
      after: String
      before: String
      first: Int
      states: [IssueState!]
    ): IssueConnection

    label(name: String!): Label

    labels(after: String, before: String, first: Int): LabelConnection

    milestone(number: Int!): Milestone

    milestones(
      after: String
      before: String
      first: Int
      states: [MilestoneState!]
    ): MilestoneConnection

    repository(name: String!, owner: String!): Repository

    users: [User]

    viewer: User!
  }

  "-- Application types --"
  enum IssueState {
    CLOSED
    OPEN
  }

  enum MilestoneState {
    CLOSED
    OPEN
  }

  enum RepositoryVisibility {
    PRIVATE
    PUBLIC
  }

  input CreateIssueInput {
    assigneeIds: [ID!]
    body: String
    labelIds: [ID!]
    milestoneId: ID
    repositoryId: ID!
    title: String!
  }

  input CreateLabelInput {
    color: String!
    description: String
    name: String!
    repositoryId: ID!
  }

  input CreateMilestoneInput {
    description: String
    dueOn: DateTime
    title: String!
    repositoryId: ID!
  }

  input CreateRepositoryInput {
    description: String
    name: String!
    ownerId: ID
    visibility: RepositoryVisibility!
  }

  input LogInInput {
    email: String!
    password: String!
  }

  input SignUpInput {
    email: String!
    password: String!
    username: String!
  }

  input UpdateIssueInput {
    assigneeIds: [ID!]
    body: String
    id: ID!
    labelIds: [ID!]
    milestoneId: ID
    title: String
  }

  input UpdateLabelInput {
    color: String
    description: String
    id: ID!
    name: String
  }

  input UpdateMilestoneInput {
    description: String
    dueOn: DateTime
    id: ID!
    title: String
  }

  interface RepositoryOwner {
    login: String!
    repositories: [Repository]
    repository(name: String!): Repository
  }

  scalar DateTime

  type AuthPayload {
    token: String
    user: User
  }

  type CloseIssueResponse {
    message: String!
    success: Boolean!
    issue: Issue
  }

  type CloseMilestoneResponse {
    message: String!
    success: Boolean!
    milestone: Milestone
  }

  type CreateIssueResponse {
    message: String!
    success: Boolean!
    issue: Issue
  }

  type CreateLabelResponse {
    message: String!
    success: Boolean!
    label: Label
  }

  type CreateMilestoneResponse {
    message: String!
    success: Boolean!
    milestone: Milestone
  }

  type CreateRepositoryPayload {
    message: String!
    repository: Repository
    success: Boolean!
  }

  type DeleteIssueResponse {
    message: String!
    success: Boolean!
  }

  type DeleteLabelResponse {
    message: String!
    success: Boolean!
  }

  type DeleteMilestoneResponse {
    message: String!
    success: Boolean!
  }

  type Issue {
    assignees: [User]
    body: String
    closed: Boolean!
    closedAt: DateTime
    createdAt: DateTime!
    createdBy: User!
    id: ID!
    labels: [Label]
    milestone: Milestone
    number: Int!
    state: IssueState!
    title: String!
    updatedAt: DateTime!
  }

  type IssueConnection {
    edges: [IssueEdge]
    nodes: [Issue]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type IssueEdge {
    cursor: String!
    node: Issue
  }

  type Label {
    createdAt: DateTime
    color: String!
    description: String
    id: ID!
    name: String!
    updatedAt: DateTime
  }

  type LabelConnection {
    edges: [LabelEdge]
    nodes: [Label]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type LabelEdge {
    cursor: String!
    node: Label
  }

  type Milestone {
    closed: Boolean!
    closedAt: DateTime
    createdAt: DateTime
    description: String
    dueOn: DateTime
    id: ID!
    number: Int!
    state: MilestoneState!
    title: String!
    updatedAt: DateTime
  }

  type MilestoneConnection {
    edges: [MilestoneEdge]
    nodes: [Milestone]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MilestoneEdge {
    cursor: String!
    node: Milestone
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
  }

  type ReopenMilestoneResponse {
    message: String!
    success: Boolean!
    milestone: Milestone
  }

  type Repository {
    createdAt: DateTime!
    description: String
    id: ID!
    isPrivate: Boolean!
    issue(number: Int!): Issue
    issues(
      after: String
      before: String
      first: Int
      states: [IssueState!]
    ): IssueConnection
    labels(after: String, before: String, first: Int): LabelConnection
    milestones(
      after: String
      before: String
      first: Int
      states: [MilestoneState!]
    ): MilestoneConnection
    name: String!
    nameWithOwner: String!
    owner: RepositoryOwner!
    updatedAt: DateTime!
    visibility: RepositoryVisibility!
  }

  type UpdateIssueResponse {
    message: String!
    success: Boolean!
    issue: Issue
  }

  type UpdateLabelResponse {
    message: String!
    success: Boolean!
    label: Label
  }

  type UpdateMilestoneResponse {
    message: String!
    success: Boolean!
    milestone: Milestone
  }

  type User implements RepositoryOwner {
    email: String!
    id: ID!
    issues(
      after: String
      before: String
      first: Int
      states: [IssueState!]
    ): IssueConnection!
    login: String!
    name: String
    repositories: [Repository]
    repository(name: String!): Repository
  }
`;

module.exports = typeDefs;
