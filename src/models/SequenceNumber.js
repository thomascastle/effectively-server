const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    entity: String,
    value: Number,
  },
  {
    collection: "sequence_numbers",
  }
);

const SequenceNumber = mongoose.model("SequenceNumber", schema);

module.exports = SequenceNumber;
