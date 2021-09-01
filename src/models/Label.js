const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  color: { required: true, type: String, unique: true },
  description: String,
  name: { required: true, type: String },
});

const Label = mongoose.model("Label", schema);

module.exports = Label;
