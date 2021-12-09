const Milestone = require("../models/Milestone");
const { toBase64, toUTF8 } = require("../utils");
const { AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

module.exports = async function milestones(
  { id },
  { after, before, first, orderBy, states },
  { user }
) {
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

  const filteredMilestones = await Milestone.find(filters).sort({
    [field]: direction,
  });

  if (after) {
    filters[field] = cursorFilters(after, direction, field, "after");
  }

  if (before) {
    filters[field] = cursorFilters(before, direction, field, "before");
  }

  const limitedMilestones = await Milestone.find(filters)
    .sort({ [field]: direction })
    .limit(limit);

  const cursorBasedMilestones = limitedMilestones.reduce(
    (edges, milestone) => [
      ...edges,
      {
        cursor: toBase64(getCursorPayload(milestone, field)),
        node: milestone,
      },
    ],
    []
  );

  const indexEndNode = filteredMilestones.findIndex(
    (milestone) =>
      getComparableValue(milestone[field], field) ===
      getComparableValue(
        limitedMilestones[limitedMilestones.length - 1][field],
        field
      )
  );
  const indexStartNode = filteredMilestones.findIndex(
    (milestone) =>
      getComparableValue(milestone[field], field) ===
      getComparableValue(limitedMilestones[0][field], field)
  );

  return {
    edges: cursorBasedMilestones,
    nodes: limitedMilestones,
    pageInfo: {
      endCursor:
        cursorBasedMilestones.length > 0
          ? cursorBasedMilestones[cursorBasedMilestones.length - 1].cursor
          : null,
      hasNextPage: !!filteredMilestones[indexEndNode + 1],
      hasPreviousPage: !!filteredMilestones[indexStartNode - 1],
      startCursor:
        cursorBasedMilestones.length > 0
          ? cursorBasedMilestones[0].cursor
          : null,
    },
    totalCount: filteredMilestones.length,
  };
};

function cursorFilters(
  cursor,
  direction = 1,
  field = "createdAt",
  preposition = "after"
) {
  if (preposition === "before") {
    return direction === 1
      ? { $lt: parseAccordingly(toUTF8(cursor), field) }
      : { $gt: parseAccordingly(toUTF8(cursor), field) };
  }

  return direction === 1
    ? { $gt: parseAccordingly(toUTF8(cursor), field) }
    : { $lt: parseAccordingly(toUTF8(cursor), field) };
}

function getComparableValue(value, field = "createdAt") {
  if (field === "updatedAt") {
    return new Date(value).valueOf();
  }

  if (field === "number") {
    return parseInt(value);
  }

  return new Date(value).valueOf();
}

function getCursorPayload(milestone, field = "createdAt") {
  if (field === "updatedAt") {
    return milestone.updatedAt.toISOString();
  }

  if (field === "number") {
    return milestone.number;
  }

  return milestone.createdAt.toISOString();
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

  if (d === "UPDATED_AT") {
    return "updatedAt";
  }

  if (d === "NUMBER") {
    return "number";
  }

  return "createdAt";

  function field(field) {
    return field ? field : "CREATED_AT";
  }
}

function parseAccordingly(value, field = "createdAt") {
  if (field === "updatedAt") {
    return new Date(value);
  }

  if (field === "number") {
    return parseInt(value);
  }

  return new Date(value);
}
