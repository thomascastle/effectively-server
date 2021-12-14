const Milestone = require("../models/Milestone");
const { AuthenticationError, UserInputError } = require("apollo-server");

module.exports = async (_, { input: { id, ...rest } }, { user }) => {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  try {
    const milestone = await Milestone.findById(id);

    if (milestone) {
      milestone.description =
        rest.description || rest.description === null || rest.description === ""
          ? rest.description
          : milestone.description;
      milestone.dueOn =
        rest.dueOn || rest.dueOn === null ? rest.dueOn : milestone.dueOn;
      if (rest.title || rest.title === "") {
        milestone.title = rest.title;
      }

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
    if (error.errors["title"]) {
      throw new UserInputError("Title cannot be blank");
    }

    throw new UserInputError(error.message);
  }
};
