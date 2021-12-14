const { APP_SECRET } = require("./auth/config");
const Issue = require("./models/Issue");
const Label = require("./models/Label");
const Milestone = require("./models/Milestone");
const Repository = require("./models/Repository");
const User = require("./models/User");
const createIssue = require("./resolvers/CreateIssue");
const createLabel = require("./resolvers/CreateLabel");
const createMilestone = require("./resolvers/CreateMilestone");
const updateIssue = require("./resolvers/UpdateIssue");
const updateLabel = require("./resolvers/UpdateLabel");
const updateMilestone = require("./resolvers/UpdateMilestone");
const RepositoryResolver = require("./resolvers/Repository");
const { AuthenticationError, UserInputError } = require("apollo-server");
const bcrypt = require("bcrypt");
const { GraphQLScalarType } = require("graphql");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const dateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  parseValue(value) {
    return new Date(value);
  },
  serialize(value) {
    return value.toISOString();
  },
});

const resolvers = {
  DateTime: dateTimeScalar,

  Issue: {
    assignees: ({ assignees: ids }) => {
      return ids.map((id) => User.findById(id));
    },

    createdBy: async ({ createdBy: id }) => {
      const creator = await User.findById(id);

      return creator;
    },

    labels: ({ labels: ids }) => {
      return ids.map((id) => Label.findById(id));
    },

    milestone: async ({ milestone: id }) => {
      const milestone = await Milestone.findById(id);

      return milestone;
    },

    repository: async ({ repositoryId }) => {
      const repository = Repository.findById(repositoryId);

      return repository;
    },

    state: ({ closed }) => {
      return closed ? "CLOSED" : "OPEN";
    },
  },

  Milestone: {
    state: ({ closed }) => {
      return closed ? "CLOSED" : "OPEN";
    },
  },

  Mutation: {
    closeIssue: async (_, { id }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const issue = await Issue.findById(id).exec();

        if (issue) {
          issue.closed = true;
          issue.closedAt = new Date();

          const closedIssue = await issue.save();

          return {
            message: "The issue has been closed.",
            success: true,
            issue: closedIssue,
          };
        } else {
          return {
            message: "The issue you were looking for could not be found.",
            success: false,
            issue: null,
          };
        }
      } catch (error) {
        return {
          message: error.message,
          success: false,
          issue: null,
        };
      }
    },

    closeMilestone: async (_, { id }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const milestone = await Milestone.findById(id).exec();

        if (milestone) {
          milestone.closed = true;
          milestone.closedAt = new Date();

          const closedMilestone = await milestone.save();

          return {
            message: "The milestone has been closed.",
            success: true,
            milestone: closedMilestone,
          };
        } else {
          return {
            message: "The milestone you were looking for could not be found.",
            success: false,
            milestone: null,
          };
        }
      } catch (error) {
        return {
          message: error.message,
          success: false,
          milestone: null,
        };
      }
    },

    createIssue: createIssue,

    createLabel: createLabel,

    createMilestone: createMilestone,

    createRepository: async (_, { input }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const repository = await Repository.create({
          description: input.description ? input.description : null,
          name: input.name,
          ownerId: input.ownerId ? input.ownerId : user.id,
          visibility: input.visibility,
        });

        return {
          message: "A new repository has been created.",
          repository,
          success: true,
        };
      } catch (error) {
        throw new UserInputError(error.message);
      }
    },

    deleteIssue: async (_, { id }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const result = await Issue.deleteOne({ _id: id });

        const { deletedCount } = result;

        if (deletedCount === 0) {
          return {
            message: "There was nothing to delete.",
            success: false,
          };
        }

        return {
          message: "The issue has been deleted.",
          success: true,
        };
      } catch (error) {
        return {
          message: error.message,
          success: false,
        };
      }
    },

    deleteLabel: async (_, { id }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const result = await Label.deleteOne({ _id: id });

        const { deletedCount } = result;

        if (deletedCount === 0) {
          return {
            message: "There was nothing to delete.",
            success: false,
          };
        }

        return {
          message: "The label has been deleted.",
          success: true,
        };
      } catch (error) {
        return {
          message: error.message,
          success: false,
        };
      }
    },

    deleteMilestone: async (_, { id }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const result = await Milestone.deleteOne({ _id: id });

        const { deletedCount } = result;

        if (deletedCount === 0) {
          return {
            message: "There was nothing to delete.",
            success: false,
          };
        }

        return {
          message: "The milestone has been deleted.",
          success: true,
        };
      } catch (error) {
        return {
          message: error.message,
          success: false,
        };
      }
    },

    login: async (_, { input }) => {
      const { email, password } = input;

      const user = await User.findOne({ email: email }).exec();

      if (!user) {
        throw new Error("No such user found");
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        throw new Error("Invalid password");
      }

      const token = jwt.sign({ userId: user.id }, APP_SECRET);

      return {
        token,
        user,
      };
    },

    reopenMilestone: async (_, { id }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const milestone = await Milestone.findById(id).exec();

        if (milestone) {
          milestone.closed = false;
          milestone.closedAt = null;

          const reopenedMilestone = await milestone.save();

          return {
            message: "The milestone has been reopened.",
            success: true,
            milestone: reopenedMilestone,
          };
        } else {
          return {
            message: "The milestone you were looking for could not be found.",
            success: false,
            milestone: null,
          };
        }
      } catch (error) {
        return {
          message: error.message,
          success: false,
          milestone: null,
        };
      }
    },

    signup: async (_, { input }) => {
      const { email, password, username } = input;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password: hashedPassword,
        username,
      });

      const token = jwt.sign({ userId: user.id }, APP_SECRET);

      return {
        token,
        user,
      };
    },

    updateIssue: updateIssue,

    updateLabel: updateLabel,

    updateMilestone: updateMilestone,
  },

  Query: {
    repository: async (_, { name, owner }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const ownerUser = await User.findOne({ username: owner });

      if (!ownerUser) {
        throw new Error(
          `Could not resolve to a Repository with the name '${owner}/${name}'.`
        );
      }

      const repository = await Repository.findOne({
        name,
        ownerId: mongoose.Types.ObjectId(ownerUser.id),
      });

      if (!repository) {
        throw new Error(
          `Could not resolve to a Repository with the name '${owner}/${name}'.`
        );
      }

      return repository;
    },

    users: async (parent, args, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const users = await User.find().exec();

      return users;
    },

    viewer: (parent, args, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      return user;
    },
  },

  Repository: RepositoryResolver,

  RepositoryOwner: {
    __resolveType() {
      // Type `User` is the only type that implements RepositoryOwner
      return "User";
    },
  },

  User: {
    issues: async ({ id }, { after, before, first, states }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const limit = first !== null && first !== undefined ? first : 10;
      const filters = { createdBy: mongoose.Types.ObjectId(id) };

      if (states) {
        const stateFilters = states.map((s) => {
          if (s === "CLOSED") {
            return true;
          }
          return false;
        });
        filters.closed = { $in: stateFilters };
      }

      const filteredIssues = await Issue.find(filters);

      const cursorBasedIssues = filteredIssues.reduce(
        (edges, issue) => [
          ...edges,
          {
            cursor: issue.number,
            node: issue,
          },
        ],
        []
      );

      const startIndex = before
        ? cursorBasedIssues.findIndex((i) => i.cursor.toString() === before)
        : cursorBasedIssues.findIndex((i) => i.cursor.toString() === after);

      const limitedIssues = before
        ? cursorBasedIssues.slice(startIndex - limit, startIndex)
        : cursorBasedIssues.slice(
            startIndex !== -1 ? startIndex + 1 : 0,
            startIndex !== -1 ? limit + startIndex + 1 : limit
          );

      const indexEndCursor = filteredIssues.findIndex(
        (issue) =>
          issue.number === limitedIssues[limitedIssues.length - 1].cursor
      );
      const indexStartCursor = filteredIssues.findIndex(
        (issue) => issue.number === limitedIssues[0].cursor
      );

      return {
        edges: limitedIssues,
        nodes: before
          ? filteredIssues.slice(startIndex - limit, startIndex)
          : filteredIssues.slice(
              startIndex !== -1 ? startIndex + 1 : 0,
              startIndex !== -1 ? limit + startIndex + 1 : limit
            ),
        pageInfo: {
          endCursor:
            limitedIssues.length > 0
              ? limitedIssues[limitedIssues.length - 1].cursor
              : null,
          hasNextPage: !!filteredIssues[indexEndCursor + 1],
          hasPreviousPage: !!filteredIssues[indexStartCursor - 1],
          startCursor:
            limitedIssues.length > 0 ? limitedIssues[0].cursor : null,
        },
        totalCount: filteredIssues.length,
      };
    },

    login: ({ username }) => {
      return username;
    },

    repository: async ({ id }, { name }) => {
      const repository = await Repository.findOne({
        name: name,
        ownerId: mongoose.Types.ObjectId(id),
      });

      return repository;
    },

    repositories: async ({ id }) => {
      const repositories = await Repository.find({
        ownerId: mongoose.Types.ObjectId(id),
      });

      return repositories;
    },
  },
};

module.exports = resolvers;
