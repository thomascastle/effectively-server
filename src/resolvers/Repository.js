const User = require("../models/User");
const RepositoryIssue = require("./RepositoryIssue");
const RepositoryIssues = require("./RepositoryIssues");
const RepositoryLabel = require("./RepositoryLabel");
const RepositoryLabels = require("./RepositoryLabels");
const RepositoryMilestone = require("./RepositoryMilestone");
const RepositoryMilestones = require("./RepositoryMilestones");

const repository = {
  isPrivate: ({ visibility }) => {
    return "PRIVATE" === visibility;
  },

  issue: RepositoryIssue,

  issues: RepositoryIssues,

  label: RepositoryLabel,

  labels: RepositoryLabels,

  milestone: RepositoryMilestone,

  milestones: RepositoryMilestones,

  nameWithOwner: async ({ name, ownerId }) => {
    const owner = await User.findById(ownerId);

    return owner.username + "/" + name;
  },

  owner: async ({ ownerId }) => {
    const owner = await User.findById(ownerId);

    return owner;
  },
};

module.exports = repository;
