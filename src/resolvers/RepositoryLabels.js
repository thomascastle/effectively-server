const Label = require("../models/Label");
const { toBase64, toUTF8 } = require("../utils");
const { AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

module.exports = async function labels(
  { id },
  { after, before, first, orderBy },
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

  const filteredLabels = await Label.find(filters).sort({ [field]: direction });

  if (after) {
    filters[field] = cursorFilters(after, direction, field, "after");
  }

  if (before) {
    filters[field] = cursorFilters(before, direction, field, "before");
  }

  const limitedLabels = await Label.find(filters)
    .sort({ [field]: direction })
    .limit(limit);

  const cursorBasedLabels = limitedLabels.reduce(
    (edges, label) => [
      ...edges,
      {
        cursor: toBase64(getCursorPayload(label, field)),
        node: label,
      },
    ],
    []
  );

  const indexEndNode = filteredLabels.findIndex(
    (label) =>
      getComparableValue(label[field], field) ===
      getComparableValue(limitedLabels[limitedLabels.length - 1][field], field)
  );
  const indexStartNode = filteredLabels.findIndex(
    (label) =>
      getComparableValue(label[field], field) ===
      getComparableValue(limitedLabels[0][field], field)
  );

  return {
    edges: cursorBasedLabels,
    nodes: limitedLabels,
    pageInfo: {
      endCursor:
        cursorBasedLabels.length > 0
          ? cursorBasedLabels[cursorBasedLabels.length - 1].cursor
          : null,
      hasNextPage: !!filteredLabels[indexEndNode + 1],
      hasPreviousPage: !!filteredLabels[indexStartNode - 1],
      startCursor:
        cursorBasedLabels.length > 0 ? cursorBasedLabels[0].cursor : null,
    },
    totalCount: filteredLabels.length,
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
  if (field === "name") {
    return value;
  }

  return new Date(value).valueOf();
}

function getCursorPayload(label, field = "createdAt") {
  if (field === "name") {
    return label.name;
  }

  return label.createdAt.toISOString();
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

  return d === "NAME" ? "name" : "createdAt";

  function field(field) {
    return field ? field : "CREATED_AT";
  }
}

function parseAccordingly(value, field = "createdAt") {
  if (field === "createdAt") {
    return new Date(value);
  }

  return value;
}
