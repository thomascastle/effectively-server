const { gql } = require("apollo-server");

const typeDefs = gql`
  "-- Default types --"
  type Mutation {
    closeIssue(id: ID!): CloseIssueResponse

    closeMilestone(id: ID!): CloseMilestoneResponse

    createIssue(input: CreateIssueInput!): CreateIssueResponse

    createLabel(input: CreateLabelInput!): CreateLabelResponse

    createMilestone(input: CreateMilestoneInput!): CreateMilestoneResponse

    createRepository(input: CreateRepositoryInput!): CreateRepositoryPayload

    deleteIssue(id: ID!): DeleteIssueResponse

    deleteLabel(id: ID!): DeleteLabelResponse

    deleteMilestone(id: ID!): DeleteMilestoneResponse

    login(input: LogInInput): AuthPayload

    reopenIssue(id: ID!): ReopenIssuePayload

    reopenMilestone(id: ID!): ReopenMilestoneResponse

    signup(input: SignUpInput): AuthPayload

    updateIssue(input: UpdateIssueInput!): UpdateIssueResponse

    updateLabel(input: UpdateLabelInput!): UpdateLabelResponse

    updateMilestone(input: UpdateMilestoneInput!): UpdateMilestoneResponse
  }

  type Query {
    repository(name: String!, owner: String!): Repository

    user(login: String!): User

    users: [User]

    viewer: User!
  }

  "-- Application types --"
  enum IssueOrderField {
    CREATED_AT
    UPDATED_AT
  }

  enum IssueState {
    CLOSED
    OPEN
  }

  enum LabelOrderField {
    CREATED_AT
    NAME
  }

  enum MilestoneOrderField {
    CREATED_AT
    NUMBER
    UPDATED_AT
  }

  enum MilestoneState {
    CLOSED
    OPEN
  }

  enum OrderDirection {
    ASC
    DESC
  }

  enum RepositoryOrderField {
    CREATED_AT
    NAME
    UPDATED_AT
  }

  enum RepositoryPrivacy {
    PRIVATE
    PUBLIC
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

  input IssueFilters {
    assignee: String
    createdBy: String
    mentioned: String
  }

  input IssueOrder {
    direction: OrderDirection!
    field: IssueOrderField!
  }

  input LabelOrder {
    direction: OrderDirection!
    field: LabelOrderField!
  }

  input LogInInput {
    email: String!
    password: String!
  }

  input MilestoneOrder {
    direction: OrderDirection!
    field: MilestoneOrderField!
  }

  input RepositoryOrder {
    direction: OrderDirection!
    field: RepositoryOrderField!
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
    repositories(
      after: String
      before: String
      first: Int
      orderBy: RepositoryOrder
      privacy: RepositoryPrivacy
    ): RepositoryConnection!
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
    repository: Repository!
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
    issues(
      after: String
      before: String
      filterBy: IssueFilters
      first: Int
      labels: [String!]
      orderBy: IssueOrder
      states: [IssueState!]
    ): IssueConnection!
    number: Int!
    progressPercentage: Float!
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

  type ReopenIssuePayload {
    issue: Issue
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
      filterBy: IssueFilters
      first: Int
      labels: [String!]
      orderBy: IssueOrder
      states: [IssueState!]
    ): IssueConnection!
    label(name: String!): Label
    labels(
      after: String
      before: String
      first: Int
      orderBy: LabelOrder
    ): LabelConnection
    milestone(number: Int!): Milestone
    milestones(
      after: String
      before: String
      first: Int
      orderBy: MilestoneOrder
      states: [MilestoneState!]
    ): MilestoneConnection
    name: String!
    nameWithOwner: String!
    owner: RepositoryOwner!
    updatedAt: DateTime!
    visibility: RepositoryVisibility!
  }

  type RepositoryConnection {
    edges: [RepositoryEdge]
    nodes: [Repository]
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type RepositoryEdge {
    cursor: String!
    node: Repository
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
      filterBy: IssueFilters
      first: Int
      labels: [String!]
      orderBy: IssueOrder
      states: [IssueState!]
    ): IssueConnection!
    login: String!
    name: String
    repositories(
      after: String
      before: String
      first: Int
      orderBy: RepositoryOrder
      privacy: RepositoryPrivacy
    ): RepositoryConnection!
    repository(name: String!): Repository
  }
`;

module.exports = typeDefs;
