const Issue = require("../models/Issue");
const Label = require("../models/Label");
const { toBase64, toUTF8 } = require("../utils");
const { AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

module.exports = async function issues(
  { id },
  { after, before, first, labels: labelNames, orderBy, states },
  { user }
) {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  const direction = orderDirection(orderBy);
  const field = orderField(orderBy);
  const filters = { milestone: mongoose.Types.ObjectId(id) };
  const limit = first !== null && first !== undefined ? first : 10;

  if (labelNames) {
    const labelFilters = await Label.find({
      name: { $in: labelNames },
      repositoryId: mongoose.Types.ObjectId(id),
    }).select("id");

    filters.labels = { $in: labelFilters };
  }

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
