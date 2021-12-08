const Issue = require("../models/Issue");
const { AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");

module.exports = async function issue({ id }, { number }, { user }) {
  if (!user) {
    const msg = "This endpoint requires you to be authenticated.";

    throw new AuthenticationError(msg);
  }

  const issue = await Issue.findOne({
    number: number,
    repositoryId: mongoose.Types.ObjectId(id),
  });

  return issue;
};
