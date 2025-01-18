const mongoose = require("mongoose");

const familySchema = new mongoose.Schema({
  familyName: String,
  address: String,
  phone: String,
  // v.v...
});

module.exports = mongoose.model("Family", familySchema);