const { gql } = require("apollo-server");

const typeDefs = gql`
  "-- Default types --"
  type Mutation {
    closeIssue(id: ID!): CloseIssueResponse

    closeMilestone(id: ID!): CloseMilestoneResponse

    createIssue(input: CreateIssueInput): CreateIssueResponse

    createLabel(input: CreateLabelInput): CreateLabelResponse

    createMilestone(input: CreateMilestoneInput): CreateMilestoneResponse

    deleteIssue(id: ID!): DeleteIssueResponse

    deleteLabel(id: ID!): DeleteLabelResponse

    deleteMilestone(id: ID!): DeleteMilestoneResponse

    reopenMilestone(id: ID!): ReopenMilestoneResponse

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

    users: [User]
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

  input CreateIssueInput {
    assigneeIds: [ID!]
    body: String
    labelIds: [ID!]
    milestoneId: ID
    title: String!
  }

  input CreateLabelInput {
    color: String!
    description: String
    name: String!
  }

  input CreateMilestoneInput {
    description: String
    dueOn: DateTime
    title: String!
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

  scalar DateTime

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

  type User {
    id: ID!
    name: String
    username: String!
  }
`;

module.exports = typeDefs;
