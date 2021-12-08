const Milestone = require("../models/Milestone");
const User = require("../models/User");
const RepositoryIssue = require("./RepositoryIssue");
const RepositoryIssues = require("./RepositoryIssues");
const RepositoryLabel = require("./RepositoryLabel");
const RepositoryLabels = require("./RepositoryLabels");
const { AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

const repository = {
  isPrivate: ({ visibility }) => {
    return "PRIVATE" === visibility;
  },

  issue: RepositoryIssue,

  issues: RepositoryIssues,

  label: RepositoryLabel,

  labels: RepositoryLabels,

  milestones: async ({ id }, { after, before, first, states }, { user }) => {
    if (!user) {
      const msg = "This endpoint requires you to be authenticated.";

      throw new AuthenticationError(msg);
    }

    const limit = first !== null && first !== undefined ? first : 10;
    const filters = { repositoryId: mongoose.Types.ObjectId(id) };

    if (states) {
      const stateFilters = states.map((s) => {
        if (s === "CLOSED") {
          return true;
        }
        return false;
      });
      filters.closed = { $in: stateFilters };
    }

    const filteredMilestones = await Milestone.find(filters).exec();

    const cursorBasedMilestones = filteredMilestones.reduce(
      (edges, milestone) => [
        ...edges,
        {
          cursor: milestone.number,
          node: milestone,
        },
      ],
      []
    );

    const startIndex = before
      ? cursorBasedMilestones.findIndex((m) => m.cursor.toString() === before)
      : cursorBasedMilestones.findIndex((m) => m.cursor.toString() === after);

    const limitedMilestones = before
      ? cursorBasedMilestones.slice(startIndex - limit, startIndex)
      : cursorBasedMilestones.slice(
          startIndex !== -1 ? startIndex + 1 : 0,
          startIndex !== -1 ? limit + startIndex + 1 : limit
        );

    const indexEndCursor = filteredMilestones.findIndex(
      (milestone) =>
        milestone.number ===
        limitedMilestones[limitedMilestones.length - 1].cursor
    );
    const indexStartCursor = filteredMilestones.findIndex(
      (milestone) => milestone.number === limitedMilestones[0].cursor
    );

    return {
      edges: limitedMilestones,
      nodes: before
        ? filteredMilestones.slice(startIndex - limit, startIndex)
        : filteredMilestones.slice(
            startIndex !== -1 ? startIndex + 1 : 0,
            startIndex !== -1 ? limit + startIndex + 1 : limit
          ),
      pageInfo: {
        endCursor:
          limitedMilestones.length > 0
            ? limitedMilestones[limitedMilestones.length - 1].cursor
            : null,
        hasNextPage: !!filteredMilestones[indexEndCursor + 1],
        hasPreviousPage: !!filteredMilestones[indexStartCursor - 1],
        startCursor:
          limitedMilestones.length > 0 ? limitedMilestones[0].cursor : null,
      },
      totalCount: filteredMilestones.length,
    };
  },

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
