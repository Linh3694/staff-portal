const mongoose = require('mongoose');

const AcsEventSchema = new mongoose.Schema({
  time: { type: String, required: true }, 
  name: { type: String, required: true }, 
  employeeNoString: { type: String },
});

const AcsEvent = mongoose.model('AcsEvent', AcsEventSchema);

module.exports = AcsEvent;