const { APP_SECRET } = require("./auth/config");
const Issue = require("./models/Issue");
const Label = require("./models/Label");
const Milestone = require("./models/Milestone");
const Repository = require("./models/Repository");
const SequenceNumber = require("./models/SequenceNumber");
const User = require("./models/User");
const { AuthenticationError } = require("apollo-server");
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
    return value.toJSON();
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

    createIssue: async (_, { input }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const sequenceNumber = await SequenceNumber.findOne({
        entity: "issue",
      }).exec();

      try {
        const issue = await Issue.create({
          assignees: input.assigneeIds ? [...input.assigneeIds] : [],
          body: input.body ? input.body : null,
          closed: false,
          createdBy: user.id,
          // TODO closedAt should be null by default
          // closedAt: null
          labels: input.labelIds ? [...input.labelIds] : [],
          milestone: input.milestoneId ? input.milestoneId : null,
          number: sequenceNumber.value,
          title: input.title,
        });

        return {
          message: "A new issue has been created.",
          success: true,
          issue: issue,
        };
      } catch (error) {
        return {
          message: error.message,
          success: false,
          issue: null,
        };
      } finally {
        // NOTE Is this a good way to do it — in the "finally"?
        await SequenceNumber.updateOne(
          { entity: "issue" },
          { $inc: { value: 1 } }
        );
      }
    },

    createLabel: async (_, { input }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const label = await Label.create({
          color: input.color,
          description: input.description ? input.description : null, // Default to null is the field is not provided
          name: input.name,
        });

        return {
          message: "A new label has been created.",
          success: true,
          label: label,
        };
      } catch (error) {
        return {
          message: error.message,
          success: false,
          label: null,
        };
      }
    },

    createMilestone: async (_, { input }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const sequenceNumber = await SequenceNumber.findOne({
        entity: "milestone",
      }).exec();

      try {
        const milestone = await Milestone.create({
          closed: false,
          description: input.description ? input.description : null,
          dueOn: input.dueOn ? input.dueOn : null,
          number: sequenceNumber.value,
          title: input.title,
        });

        return {
          message: "A new milestone has been created.",
          success: true,
          milestone: milestone,
        };
      } catch (error) {
        return {
          message: error.message,
          success: false,
          milestone: null,
        };
      } finally {
        // NOTE Is this a good way to do it — in the "finally"?
        await SequenceNumber.updateOne(
          { entity: "milestone" },
          { $inc: { value: 1 } }
        );
      }
    },

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
        return {
          message: error.message,
          repository: null,
          success: false,
        };
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

    updateIssue: async (_, { input: { id, ...rest } }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const issue = await Issue.findById(id).exec();

        if (issue) {
          issue.assignees = rest.assigneeIds
            ? [...rest.assigneeIds]
            : [...issue.assignees];
          issue.body =
            rest.body || rest.body === null || rest.body === ""
              ? rest.body
              : issue.body;
          issue.labels = rest.labelIds ? [...rest.labelIds] : [...issue.labels];
          issue.milestone =
            rest.milestoneId || rest.milestoneId === null
              ? rest.milestoneId
              : issue.milestone;
          issue.title = rest.title ? rest.title : issue.title;

          const updatedIssue = await issue.save();

          return {
            message: "The issue has been updated.",
            success: true,
            issue: updatedIssue,
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
          label: null,
        };
      }
    },

    updateLabel: async (_, { input: { id, ...rest } }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const label = await Label.findById(id).exec();

        if (label) {
          label.color = rest.color ? rest.color : label.color;
          label.description =
            rest.description || rest.description === null
              ? rest.description
              : label.description;
          label.name = rest.name ? rest.name : label.name;

          const updatedLabel = await label.save();

          return {
            message: "The label has been updated.",
            success: true,
            label: updatedLabel,
          };
        } else {
          return {
            message: "The label you were looking for could not be found.",
            success: false,
            label: null,
          };
        }
      } catch (error) {
        return {
          message: error.message,
          success: false,
          label: null,
        };
      }
    },

    updateMilestone: async (_, { input: { id, ...rest } }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      try {
        const milestone = await Milestone.findById(id).exec();

        if (milestone) {
          milestone.description =
            rest.description || rest.description === null
              ? rest.description
              : milestone.description;
          milestone.dueOn = rest.dueOn ? rest.dueOn : milestone.dueOn;
          milestone.title = rest.title ? rest.title : milestone.title;

          const updatedMilestone = await milestone.save();

          return {
            message: "The milestone has been updated.",
            success: true,
            milestone: updatedMilestone,
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
  },

  Query: {
    issue: async (_, { number }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const issue = await Issue.findOne({ number: number }).exec();

      return issue;
    },

    issues: async (_, { after, before, first, states }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const limit = first !== null && first !== undefined ? first : 10;
      const filters = {};

      if (states) {
        const stateFilters = states.map((s) => {
          if (s === "CLOSED") {
            return true;
          }
          return false;
        });
        filters.closed = { $in: stateFilters };
      }

      const filteredIssues = await Issue.find(filters).exec();

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
          endCursor: limitedIssues[limitedIssues.length - 1].cursor,
          hasNextPage: !!filteredIssues[indexEndCursor + 1],
          hasPreviousPage: !!filteredIssues[indexStartCursor - 1],
          startCursor: limitedIssues[0].cursor,
        },
        totalCount: filteredIssues.length,
      };
    },

    label: async (_, { name }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const label = await Label.findOne({ name: name }).exec();

      return label;
    },

    labels: async (_, { after, before, first }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const limit = first !== null && first !== undefined ? first : 10;

      // TODO Find the most efficient way to do it
      const allLabels = await Label.find().exec();

      const cursorBasedLabels = allLabels.reduce(
        (edges, label) => [
          ...edges,
          {
            cursor: label.name,
            node: label,
          },
        ],
        []
      );

      const startIndex = before
        ? cursorBasedLabels.findIndex((l) => l.cursor === before)
        : cursorBasedLabels.findIndex((l) => l.cursor === after);

      const limitedLabels = before
        ? cursorBasedLabels.slice(startIndex - limit, startIndex)
        : cursorBasedLabels.slice(
            startIndex !== -1 ? startIndex + 1 : 0,
            startIndex !== -1 ? limit + startIndex + 1 : limit
          );

      const indexEndCursor = allLabels.findIndex(
        (label) => label.name === limitedLabels[limitedLabels.length - 1].cursor
      );
      const indexStartCursor = allLabels.findIndex(
        (label) => label.name === limitedLabels[0].cursor
      );

      return {
        edges: limitedLabels,
        nodes: before
          ? allLabels.slice(startIndex - limit, startIndex)
          : allLabels.slice(
              startIndex !== -1 ? startIndex + 1 : 0,
              startIndex !== -1 ? limit + startIndex + 1 : limit
            ),
        pageInfo: {
          endCursor: limitedLabels[limitedLabels.length - 1].cursor,
          hasNextPage: !!allLabels[indexEndCursor + 1],
          hasPreviousPage: !!allLabels[indexStartCursor - 1],
          startCursor: limitedLabels[0].cursor,
        },
        totalCount: allLabels.length,
      };
    },

    milestone: async (_, { number }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const milestone = await Milestone.findOne({ number: number }).exec();

      return milestone;
    },

    milestones: async (_, { after, before, first, states }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const limit = first !== null && first !== undefined ? first : 10;
      const filters = {};

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
          endCursor: limitedMilestones[limitedMilestones.length - 1].cursor,
          hasNextPage: !!filteredMilestones[indexEndCursor + 1],
          hasPreviousPage: !!filteredMilestones[indexStartCursor - 1],
          startCursor: limitedMilestones[0].cursor,
        },
        totalCount: filteredMilestones.length,
      };
    },

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

  Repository: {
    isPrivate: ({ visibility }) => {
      return "PRIVATE" === visibility;
    },

    issues: async ({ id }, { after, before, first, states }, { user }) => {
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

    labels: async ({ id }, { after, before, first }, { user }) => {
      if (!user) {
        const msg = "This endpoint requires you to be authenticated.";

        throw new AuthenticationError(msg);
      }

      const limit = first !== null && first !== undefined ? first : 10;

      // TODO Find the most efficient way to do it
      const allLabels = await Label.find({
        repositoryId: mongoose.Types.ObjectId(id),
      });

      const cursorBasedLabels = allLabels.reduce(
        (edges, label) => [
          ...edges,
          {
            cursor: label.name,
            node: label,
          },
        ],
        []
      );

      const startIndex = before
        ? cursorBasedLabels.findIndex((l) => l.cursor === before)
        : cursorBasedLabels.findIndex((l) => l.cursor === after);

      const limitedLabels = before
        ? cursorBasedLabels.slice(startIndex - limit, startIndex)
        : cursorBasedLabels.slice(
            startIndex !== -1 ? startIndex + 1 : 0,
            startIndex !== -1 ? limit + startIndex + 1 : limit
          );

      const indexEndCursor = allLabels.findIndex(
        (label) => label.name === limitedLabels[limitedLabels.length - 1].cursor
      );
      const indexStartCursor = allLabels.findIndex(
        (label) => label.name === limitedLabels[0].cursor
      );

      return {
        edges: limitedLabels,
        nodes: before
          ? allLabels.slice(startIndex - limit, startIndex)
          : allLabels.slice(
              startIndex !== -1 ? startIndex + 1 : 0,
              startIndex !== -1 ? limit + startIndex + 1 : limit
            ),
        pageInfo: {
          endCursor:
            limitedLabels.length > 0
              ? limitedLabels[limitedLabels.length - 1].cursor
              : null,
          hasNextPage: !!allLabels[indexEndCursor + 1],
          hasPreviousPage: !!allLabels[indexStartCursor - 1],
          startCursor:
            limitedLabels.length > 0 ? limitedLabels[0].cursor : null,
        },
        totalCount: allLabels.length,
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
  },

  RepositoryOwner: {
    __resolveType() {
      // Type `User` is the only type that implements RepositoryOwner
      return "User";
    },
  },

  User: {
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
