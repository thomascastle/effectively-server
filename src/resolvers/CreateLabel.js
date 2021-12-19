const Label = require("../models/Label");
const { AuthenticationError, UserInputError } = require("apollo-server");

module.exports = async (_, { input }, { user }) => {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  validate(input);

  try {
    const label = await Label.create({
      color: formatColor(input.color),
      description:
        input.description || input.description === ""
          ? input.description
          : null,
      name: input.name,
      repositoryId: input.repositoryId,
    });

    return {
      message: "A new label has been created.",
      success: true,
      label: label,
    };
  } catch (error) {
    if (error.code === 11000) {
      throw new UserInputError("Duplicate label name");
    }

    if (error.errors["name"]) {
      throw new UserInputError("Name cannot be blank");
    }

    throw new UserInputError(error.message);
  }
};

function validate(input) {
  const { color } = input;

  if (!/^([0-9A-F]{3}){1,2}$/i.test(color)) {
    throw new UserInputError("Invalid color code");
  }
}

function formatColor(value) {
  if (value.length === 3) {
    return value.split("").reduce((a, c) => a.concat(c.concat(c)), "");
  }

  return value;
}
