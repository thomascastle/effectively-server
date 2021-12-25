const MilestoneIssues = require("./MilestoneIssues.js");

module.exports = {
  issues: MilestoneIssues,

  state: ({ closed }) => {
    return closed ? "CLOSED" : "OPEN";
  },
};
