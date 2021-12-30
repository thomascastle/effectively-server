const Repository = require("../models/Repository");
const issues = require("./Issues");
const repositories = require("./Repositories");
const mongoose = require("mongoose");

module.exports = {
  issues: issues,

  login: ({ username }) => {
    return username;
  },

  repositories: repositories,

  repository: async ({ id }, { name }) => {
    const repository = await Repository.findOne({
      name: name,
      ownerId: mongoose.Types.ObjectId(id),
    });

    return repository;
  },
};
