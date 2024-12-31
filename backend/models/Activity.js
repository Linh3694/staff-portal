const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  laptopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Laptop', required: true },
  type: { type: String, enum: ['repair', 'update'], required: true },
  description: { type: String, required: true },
  details: { type: String },
  date: { type: Date, required: true, default: Date.now }, // Thời gian mặc định
  updatedBy: { type: String }, // Người thực hiện
});

module.exports = mongoose.model('Activity', activitySchema);