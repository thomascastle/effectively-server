const Label = require("../models/Label");
const { AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

module.exports = async function label({ id }, { name }, { user }) {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  const label = await Label.findOne({
    name: name,
    repositoryId: mongoose.Types.ObjectId(id),
  });

  return label;
};
