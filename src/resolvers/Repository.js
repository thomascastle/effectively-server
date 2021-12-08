const Issue = require("../models/Issue");
const Label = require("../models/Label");
const Milestone = require("../models/Milestone");
const User = require("../models/User");
const { toBase64, toUTF8 } = require("../utils");
const RepositoryLabels = require("./RepositoryLabels");
const { AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

const repository = {
  isPrivate: ({ visibility }) => {
    return "PRIVATE" === visibility;
  },

  issue: async ({ id }, { number }, { user }) => {
    if (!user) {
      const msg = "This endpoint requires you to be authenticated.";

      throw new AuthenticationError(msg);
    }

    const issue = await Issue.findOne({
      number: number,
      repositoryId: mongoose.Types.ObjectId(id),
    });

    return issue;
  },

  issues: async (
    { id },
    { after, before, first, orderBy, states },
    { user }
  ) => {
    if (!user) {
      const msg = "This endpoint requires you to be authenticated.";

      throw new AuthenticationError(msg);
    }

    const direction = orderDirection(orderBy);
    const field = orderField(orderBy);
    const filters = { repositoryId: mongoose.Types.ObjectId(id) };
    const limit = first !== null && first !== undefined ? first : 10;

    if (states) {
      const stateFilters = states.map((s) => {
        if (s === "CLOSED") {
          return true;
        }
        return false;
      });
      filters.closed = { $in: stateFilters };
    }

    const filteredIssues = await Issue.find(filters).sort({
      [field]: direction,
    });

    if (after) {
      filters[field] =
        direction === 1
          ? { $gt: new Date(toUTF8(after)) }
          : { $lt: new Date(toUTF8(after)) };
    }

    if (before) {
      filters[field] =
        direction === 1
          ? { $lt: new Date(toUTF8(before)) }
          : { $gt: new Date(toUTF8(before)) };
    }

    const limitedIssues = await Issue.find(filters)
      .sort({
        [field]: direction,
      })
      .limit(limit);

    const cursorBasedIssues = limitedIssues.reduce(
      (edges, issue) => [
        ...edges,
        {
          cursor: toBase64(getCursorPayload(issue, field)),
          node: issue,
        },
      ],
      []
    );

    const indexEndNode = filteredIssues.findIndex(
      (issue) =>
        new Date(issue[field]).valueOf() ===
        new Date(limitedIssues[limitedIssues.length - 1][field]).valueOf()
    );
    const indexStartNode = filteredIssues.findIndex(
      (issue) =>
        new Date(issue[field]).valueOf() ===
        new Date(limitedIssues[0][field]).valueOf()
    );

    return {
      edges: cursorBasedIssues,
      nodes: limitedIssues,
      pageInfo: {
        endCursor:
          cursorBasedIssues.length > 0
            ? cursorBasedIssues[cursorBasedIssues.length - 1].cursor
            : null,
        hasNextPage: !!filteredIssues[indexEndNode + 1],
        hasPreviousPage: !!filteredIssues[indexStartNode - 1],
        startCursor:
          cursorBasedIssues.length > 0 ? cursorBasedIssues[0].cursor : null,
      },
      totalCount: filteredIssues.length,
    };
  },

  label: async ({ id }, { name }, { user }) => {
    if (!user) {
      const msg = "This endpoint requires you to be authenticated.";

      throw new AuthenticationError(msg);
    }

    const label = await Label.findOne({
      name: name,
      repositoryId: mongoose.Types.ObjectId(id),
    }).exec();

    return label;
  },

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

function getCursorPayload(issue, field = "createdAt") {
  if (field === "updatedAt") {
    return issue.updatedAt.toISOString();
  }

  return issue.createdAt.toISOString();
}

function orderDirection(orderBy) {
  const d = direction(orderBy && orderBy.direction);

  return d === "DESC" ? -1 : 1;

  function direction(direction) {
    return direction ? direction : "ASC";
  }
}

function orderField(orderBy) {
  const d = field(orderBy && orderBy.field);

  return d === "UPDATED_AT" ? "updatedAt" : "createdAt";

  function field(field) {
    return field ? field : "CREATED_AT";
  }
}

module.exports = repository;
