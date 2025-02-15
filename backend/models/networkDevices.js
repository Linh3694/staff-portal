const mongoose = require("mongoose");

const networkDevicesSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["Camera", "Network"], default: "Laptop" },
    manufacturer: { type: String },
    serial: { type: String, required: true },
    releaseYear: { type: Number },
    address: { type: String, required: true, unique: true }, // Địa chỉ IP
    lastseen: { type: Date, default: Date.now },
    online: { type: Boolean, default: false }, // Trạng thái online/offline
  },
  { timestamps: true }
);

module.exports = mongoose.model("networkDevices", networkDevicesSchema);