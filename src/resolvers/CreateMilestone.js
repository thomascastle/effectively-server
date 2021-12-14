const Milestone = require("../models/Milestone");
const SequenceNumber = require("../models/SequenceNumber");
const { AuthenticationError, UserInputError } = require("apollo-server");

module.exports = async (_, { input }, { user }) => {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  const milestoneNumber = await SequenceNumber.findOne({
    entity: "milestone",
  });

  try {
    const milestone = await Milestone.create({
      closed: false,
      description: input.description ? input.description : null,
      dueOn: input.dueOn ? input.dueOn : null,
      number: milestoneNumber.value,
      repositoryId: input.repositoryId,
      title: input.title,
    });

    return {
      message: "A new milestone has been created.",
      success: true,
      milestone: milestone,
    };
  } catch (error) {
    throw new UserInputError(error.message);
  } finally {
    // NOTE Is this a good way to do it — in the "finally"?
    await SequenceNumber.updateOne(
      { entity: "milestone" },
      { $inc: { value: 1 } }
    );
  }
};
