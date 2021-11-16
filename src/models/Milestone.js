const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    closed: { required: true, type: Boolean },
    closedAt: Date,
    description: String,
    dueOn: Date,
    number: { required: true, type: Number },
    repositoryId: {
      ref: "Repository",
      required: true,
      type: mongoose.SchemaTypes.ObjectId,
    },
    title: { required: true, type: String },
  },
  {
    timestamps: true,
  }
);

const Milestone = mongoose.model("Milestone", schema);

module.exports = Milestone;
