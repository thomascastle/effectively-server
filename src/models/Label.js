const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    color: { required: true, type: String },
    description: { type: String },
    name: { required: true, type: String },
    repositoryId: {
      ref: "Repository",
      required: true,
      type: mongoose.SchemaTypes.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

schema.index({ repositoryId: 1, name: 1 }, { unique: true });

const Label = mongoose.model("Label", schema);

module.exports = Label;
