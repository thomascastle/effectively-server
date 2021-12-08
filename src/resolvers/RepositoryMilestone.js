const Milestone = require("../models/Milestone");
const { AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

module.exports = async function milestone({ id }, { number }, { user }) {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  const milestone = await Milestone.findOne({
    number: number,
    repositoryId: mongoose.Types.ObjectId(id),
  });

  return milestone;
};
