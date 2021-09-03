const Issue = require("./models/Issue");
const Label = require("./models/Label");
const Milestone = require("./models/Milestone");
const User = require("./models/User");
const SequenceNumber = require("./models/SequenceNumber");
const { GraphQLScalarType } = require("graphql");

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
  },

  Milestone: {
    state: ({ closed }) => {
      return closed ? "CLOSED" : "OPEN";
    },
  },

  Mutation: {
    closeIssue: async (_, { id }) => {
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

    closeMilestone: async (_, { id }) => {
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

    createIssue: async (_, { input }) => {
      const sequenceNumber = await SequenceNumber.findOne({
        entity: "issue",
      }).exec();

      try {
        const issue = await Issue.create({
          assignees: input.assigneeIds ? [...input.assigneeIds] : [],
          body: input.body ? input.body : null,
          closed: false,
          // TODO closedAt should be null by default
          // closedAt: null
          labels: input.labelIds ? [...input.labelIds] : [],
          milestone: input.milestoneId ? input.milestoneId : null,
          number: sequenceNumber.value,
          status: "open",
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

    createLabel: async (_, { input }) => {
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

    createMilestone: async (_, { input }) => {
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

    deleteIssue: async (_, { id }) => {
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

    deleteLabel: async (_, { id }) => {
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

    deleteMilestone: async (_, { id }) => {
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

    reopenMilestone: async (_, { id }) => {
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

    updateIssue: async (_, { input: { id, ...rest } }) => {
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

    updateLabel: async (_, { input: { id, ...rest } }) => {
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

    updateMilestone: async (_, { input: { id, ...rest } }) => {
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
    issue: async (_, { number }) => {
      const issue = await Issue.findOne({ number: number }).exec();

      return issue;
    },

    issues: async () => {
      const issues = await Issue.find().exec();

      return issues;
    },

    label: async (_, { name }) => {
      const label = await Label.findOne({ name: name }).exec();

      return label;
    },
    labels: async () => {
      const labels = await Label.find().exec();

      return { nodes: labels, totalCount: labels.length };
    },

    milestone: async (_, { number }) => {
      const milestone = await Milestone.findOne({ number: number }).exec();

      return milestone;
    },

    milestones: async (_, { states }) => {
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

      const milestones = await Milestone.find(filters).exec();

      return {
        nodes: milestones,
        totalCount: milestones.length,
      };
    },

    users: async () => {
      const users = await User.find().exec();

      return users;
    },
  },
};

module.exports = resolvers;
