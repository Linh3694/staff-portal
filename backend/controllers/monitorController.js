const Monitor = require("../models/Monitor");
const User = require("../models/Users");
const mongoose = require("mongoose");
const Notification = require('../models/notification');

// Lấy danh sách monitor
exports.getMonitors = async (req, res) => {
  try {
    // Lấy danh sách monitor từ database
    const monitors = await Monitor.find().lean(); // Sử dụng `.lean()` để trả về plain objects
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
        jobTitle: user.jobTitle || "Không xác định", // Giá trị mặc định nếu thiếu jobTitle
        department: user.department || "Không xác định", // Giá trị mặc định nếu thiếu department
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

// Cập nhật monitor
exports.updateMonitor = async (req, res) => {
  try {
    const updatedMonitor = await Monitor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Monitor updated successfully', monitor: updatedMonitor });
  } catch (error) {
    console.error('Error updating monitor:', error);
    res.status(500).json({ message: 'Server error', error });
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