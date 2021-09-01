const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: String,
  username: { required: true, type: String },
});

const User = mongoose.model("User", schema);

module.exports = User;
