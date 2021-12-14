const Issue = require("../models/Issue");
const { AuthenticationError, UserInputError } = require("apollo-server");

module.exports = async (_, { input: { id, ...rest } }, { user }) => {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  try {
    const issue = await Issue.findById(id);

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
      if (rest.title || rest.title === "") {
        issue.title = rest.title;
      }

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
    if (error.errors["title"]) {
      throw new UserInputError("Title cannot be blank");
    }

    throw new UserInputError(error.message);
  }
};
