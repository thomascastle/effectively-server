const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    assignees: [{ ref: "User", type: mongoose.SchemaTypes.ObjectId }],
    body: String,
    closed: { required: true, type: Boolean },
    closedAt: Date,
    createdBy: { ref: "User", type: mongoose.SchemaTypes.ObjectId },
    labels: [{ ref: "Label", type: mongoose.SchemaTypes.ObjectId }],
    milestone: { ref: "Milestone", type: mongoose.SchemaTypes.ObjectId },
    number: Number,
    status: String,
    title: { required: true, type: String },
  },
  {
    timestamps: true,
  }
);

const Issue = mongoose.model("Issue", schema);

module.exports = Issue;
