const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEng: { type: String, required: true },
  number: { type: String, required: true },
  description: { type:String, required: true},
  descriptionEng: { type:String, required: true},
  image: {type:String },
  endDate: { type: Date },
  startDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Event", EventSchema);