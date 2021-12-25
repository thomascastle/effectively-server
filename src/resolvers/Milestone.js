const Issue = require("../models/Issue");
const MilestoneIssues = require("./MilestoneIssues.js");
const mongoose = require("mongoose");

module.exports = {
  issues: MilestoneIssues,

  progressPercentage: async ({ id }) => {
    const filters = { milestone: mongoose.Types.ObjectId(id) };

    const countAll = await Issue.find(filters).count();
    const countClosed = await Issue.find({ ...filters, closed: true }).count();

    return (countClosed / countAll) * 100;
  },

  state: ({ closed }) => {
    return closed ? "CLOSED" : "OPEN";
  },
};
