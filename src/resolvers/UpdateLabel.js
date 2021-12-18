const Label = require("../models/Label");
const {
  AuthenticationError,
  UserInputError,
  ValidationError,
} = require("apollo-server");

module.exports = async (_, { input: { id, ...rest } }, { user }) => {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  validate(rest);

  try {
    const label = await Label.findById(id);

    if (label) {
      label.color = rest.color ? formatColor(rest.color) : label.color;
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
    if (error.code === 11000) {
      throw new UserInputError("Duplicate label name");
    }

    throw new UserInputError(error.message);
  }
};

function validate(input) {
  const { color, name } = input;

  if (color) {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      throw new ValidationError("Invalid color code");
    }
  }

  if (name === "") {
    throw new ValidationError("Name cannot be blank");
  }
}

function formatColor(value) {
  const v = value.slice(value.indexOf("#") + 1);

  if (v.length === 3) {
    return v.split("").reduce((a, c) => a.concat(c.concat(c)), "");
  }

  return v;
}
