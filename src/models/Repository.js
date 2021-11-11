const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    description: { type: String },
    name: { required: true, type: String },
    ownerId: { required: true, type: mongoose.SchemaTypes.ObjectId },
    visibility: { required: true, type: String },
  },
  {
    timestamps: true,
  }
);

const Repository = mongoose.model("Repository", schema);

module.exports = Repository;
