const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: { type: String, required: true }, 
    schoolYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolYear",
      required: true
    },
    homeroomTeacher: { type: String },
  },
  { timestamps: true }
);

classSchema.index({ className: 1, schoolYear: 1 }, { unique: true });


module.exports = mongoose.model("Class", classSchema);