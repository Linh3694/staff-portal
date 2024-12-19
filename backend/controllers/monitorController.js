const Monitor = require("../models/Monitor");
const User = require("../models/Users");
const Room = require("../models/Room");
const mongoose = require("mongoose");
const Notification = require('../models/notification');

// Lấy danh sách monitor
exports.getMonitors = async (req, res) => {
  try {
    // Lấy danh sách monitor từ database
    const monitors = await Monitor.find()
      .populate('room', 'name location') // Populate room với trường name và location
      .lean();

    console.log(`Fetched ${monitors.length} monitors.`);

    // Lấy tất cả ID từ trường "assigned" trong các monitor
    const allAssignedIds = monitors
      .filter((monitor) => Array.isArray(monitor.assigned))
      .flatMap((monitor) => monitor.assigned);

    // Truy vấn thông tin tất cả người dùng liên quan
    const users = await User.find({ _id: { $in: allAssignedIds } }).lean();
    console.log(`Fetched ${users.length} users for assigned monitors.`);

    // Tạo một object để ánh xạ nhanh theo `_id`
    const usersById = users.reduce((acc, user) => {
      acc[user._id] = {
        _id: user._id,
        name: user.fullname || "Không xác định",
        jobTitle: user.jobTitle || "Không xác định",
        department: user.department || "Không xác định",
      };
      return acc;
    }, {});

    // Gắn thông tin "assigned" vào từng monitor
    const populatedMonitors = monitors.map((monitor) => ({
      ...monitor,
      assigned: (monitor.assigned || []).map((userId) => usersById[userId] || userId),
    }));

    res.json(populatedMonitors);
  } catch (error) {
    console.error('Error fetching monitors:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Tạo monitor mới
exports.createMonitor = async (req, res) => {
  try {
    const newMonitor = new Monitor(req.body);
    await newMonitor.save();
    res.status(201).json({ message: 'Monitor created successfully', monitor: newMonitor });
  } catch (error) {
    console.error('Error creating monitor:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { room, ...updateData } = req.body;

    // Kiểm tra nếu có cập nhật room
    if (room) {
      const isValidRoom = mongoose.Types.ObjectId.isValid(room);
      if (!isValidRoom) {
        return res.status(400).json({ message: "Room ID không hợp lệ" });
      }

      const existingRoom = await Room.findById(room);
      if (!existingRoom) {
        return res.status(400).json({ message: "Room không tồn tại" });
      }
    }

    const updatedMonitor = await Monitor.findByIdAndUpdate(
      id,
      { ...updateData, room }, // Gán giá trị `room`
      { new: true }
    );

    if (!updatedMonitor) {
      return res.status(404).json({ message: "Monitor không tồn tại" });
    }

    res.status(200).json({ message: "Cập nhật Monitor thành công", monitor: updatedMonitor });
  } catch (error) {
    console.error("Lỗi khi cập nhật monitor:", error.message);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Xóa monitor
exports.deleteMonitor = async (req, res) => {
  try {
    await Monitor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Monitor deleted successfully' });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Thêm nhật ký sửa chữa
exports.addRepairLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description } = req.body;
    const monitor = await Monitor.findById(id);
    if (!monitor) {
      return res.status(404).json({ message: 'Monitor not found' });
    }
    monitor.repairs.push({ date, description });
    await monitor.save();
    res.json({ message: 'Repair log added successfully', monitor });
  } catch (error) {
    console.error('Error adding repair log:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};