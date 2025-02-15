const NetworkDevice = require("../models/networkDevices");

/**
 * Lấy danh sách tất cả thiết bị mạng
 */
exports.getAllDevices = async (req, res) => {
  try {
    const devices = await NetworkDevice.find();
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách thiết bị.", error });
  }
};

/**
 * Thêm thiết bị mạng mới
 */
exports.addDevice = async (req, res) => {
  try {
    const { name, type, manufacturer, serial, releaseYear, address } = req.body;

    if (!name || !serial || !address) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc (name, serial, address)." });
    }

    const newDevice = new NetworkDevice({ name, type, manufacturer, serial, releaseYear, address });
    await newDevice.save();

    res.status(201).json({ message: "Thêm thiết bị thành công.", device: newDevice });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi thêm thiết bị.", error });
  }
};

/**
 * Cập nhật trạng thái thiết bị (Dựa trên địa chỉ IP)
 */
exports.updateDeviceStatus = async (req, res) => {
  try {
    const { address, status } = req.body; // status = "Online" hoặc "Offline"

    if (!address || !status) {
      return res.status(400).json({ message: "Thiếu thông tin địa chỉ IP hoặc trạng thái." });
    }

    const device = await NetworkDevice.findOne({ address });

    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị với IP này." });
    }

    device.lastseen = new Date();
    device.online = status === "Online"; // Thêm trạng thái online vào database nếu cần

    await device.save();
    res.status(200).json({ message: "Cập nhật trạng thái thành công.", device });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái.", error });
  }
};

/**
 * Xóa thiết bị theo ID
 */
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await NetworkDevice.findByIdAndDelete(id);
    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị." });
    }

    res.status(200).json({ message: "Xóa thiết bị thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa thiết bị.", error });
  }
};