const mongoose = require('mongoose');
const dayjs = require('dayjs');


const AcsEventSchema = new mongoose.Schema({
  time: { type: String }, 
  name: { type: String }, 
  employeeNoString: { type: String },
});

AcsEventSchema.pre('save', function(next) {
  this.time = dayjs(this.time).toISOString(); // Chuẩn hóa thành ISO
  console.log(`Saving attendance: ${this.time}`); // Log giá trị thực tế
  next();
});

const AcsEvent = mongoose.model('AcsEvent', AcsEventSchema);

module.exports = AcsEvent;