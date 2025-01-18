const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentCode: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    klass: [
      {
        year: {
          type: Number,
          required: true,
        },
        className: {
          type: String,
          required: true,
        },
      },
    ],
    // family: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Family",
    //   // Hoặc "String" tuỳ backend,
    //   // Mục đích là liên kết tới 1 Gia đình (check 1 gia đình có nhiều con)
    // },
    birthYear: {
      type: Number,
      // Hoặc direct "age: Number", 
      // hay "birthDate: Date" => tuỳ bạn
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);