const Issue = require("../models/Issue");
const SequenceNumber = require("../models/SequenceNumber");
const { AuthenticationError, UserInputError } = require("apollo-server");

module.exports = async (_, { input }, { user }) => {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  const issueNumber = await SequenceNumber.findOne({
    entity: "issue",
  });

  try {
    const issue = await Issue.create({
      assignees: input.assigneeIds ? [...input.assigneeIds] : [],
      body: input.body || input.body === "" ? input.body : null,
      closed: false,
      createdBy: user.id,
      // TODO closedAt should be null by default
      // closedAt: null
      labels: input.labelIds ? [...input.labelIds] : [],
      milestone: input.milestoneId ? input.milestoneId : null,
      number: issueNumber.value,
      repositoryId: input.repositoryId,
      title: input.title,
    });

    return {
      message: "A new issue has been created.",
      success: true,
      issue: issue,
    };
  } catch (error) {
    throw new UserInputError(error.message);
  } finally {
    // NOTE Is this a good way to do it — in the "finally"?
    await SequenceNumber.updateOne({ entity: "issue" }, { $inc: { value: 1 } });
  }
};
