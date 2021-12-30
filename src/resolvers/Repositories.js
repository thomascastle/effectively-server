const Repository = require("../models/Repository");
const { toBase64, toUTF8 } = require("../utils");
const mongoose = require("mongoose");

module.exports = async (
  { id },
  { after, before, first, orderBy, privacy },
  { user }
) => {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  const direction = orderDirection(orderBy);
  const field = orderField(orderBy);
  const filters = { ownerId: mongoose.Types.ObjectId(id) };
  const limit = first !== null && first !== undefined ? first : 10;

  if (privacy) {
    filters.visibility = privacy;
  }

  const filteredRepositories = await Repository.find(filters).sort({
    [field]: direction,
  });

  if (after) {
    filters[field] = cursorFilters(after, direction, field, "after");
  }

  if (before) {
    filters[field] = cursorFilters(before, direction, field, "before");
  }

  const limitedRepositories = await Repository.find(filters)
    .sort({ [field]: direction })
    .limit(limit);

  const cursorBasedRepositories = limitedRepositories.reduce(
    (edges, repository) => [
      ...edges,
      {
        cursor: toBase64(getCursorPayload(repository, field)),
        node: repository,
      },
    ],
    []
  );

  const indexEndNode = filteredRepositories.findIndex(
    (repository) =>
      getComparableValue(repository[field], field) ===
      getComparableValue(
        limitedRepositories[limitedRepositories.length - 1][field],
        field
      )
  );
  const indexStartNode = filteredRepositories.findIndex(
    (repository) =>
      getComparableValue(repository[field], field) ===
      getComparableValue(limitedRepositories[0][field], field)
  );

  return {
    edges: cursorBasedRepositories,
    nodes: limitedRepositories,
    pageInfo: {
      endCursor:
        cursorBasedRepositories.length > 0
          ? cursorBasedRepositories[cursorBasedRepositories.length - 1].cursor
          : null,
      hasNextPage: !!filteredRepositories[indexEndNode + 1],
      hasPreviousPage: !!filteredRepositories[indexStartNode - 1],
      startCursor:
        cursorBasedRepositories.length > 0
          ? cursorBasedRepositories[0].cursor
          : null,
    },
    totalCount: filteredRepositories.length,
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

  if (field === "updatedAt") {
    return new Date(value).valueOf();
  }

  return new Date(value).valueOf();
}

function getCursorPayload(repository, field = "createdAt") {
  if (field === "name") {
    return repository.name;
  }

  if (field === "updatedAt") {
    return repository.updatedAt.toISOString();
  }

  return repository.createdAt.toISOString();
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

  if (d === "NAME") {
    return "name";
  }

  if (d === "UPDATED_AT") {
    return "updatedAt";
  }

  return "createdAt";

  function field(field) {
    return field ? field : "CREATED_AT";
  }
}

function parseAccordingly(value, field = "createdAt") {
  if (field === "name") {
    return value;
  }

  if (field === "updatedAt") {
    return new Date(value);
  }

  return new Date(value);
}
