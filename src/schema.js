const { gql } = require("apollo-server");

const typeDefs = gql`
  "-- Default types --"
  type Mutation {
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

    issues: [Issue]

    label(name: String!): Label

    labels: [Label]

    milestone(number: Int!): Milestone

    milestones: [Milestone]

    users: [User]
  }

  "-- Application types --"
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
    createdAt: DateTime!
    createdBy: User!
    id: ID!
    labels: [Label]
    milestone: Milestone
    number: Int!
    status: String!
    title: String!
    updatedAt: DateTime!
  }

  type Label {
    color: String!
    description: String
    id: ID!
    name: String!
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
