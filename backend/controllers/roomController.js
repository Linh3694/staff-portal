const Room = require("../models/Room");

// Lấy tất cả phòng
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm phòng mới
exports.addRoom = async (req, res) => {
  try {
    const { name, location, status } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: "Tên phòng và Địa điểm là bắt buộc" });
    }

    const newRoom = new Room({ name, location, status });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin phòng
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;

    const room = await Room.findById(id);
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });

    room.name = name || room.name;
    room.location = location || room.location;
    room.status = status || room.status;

    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa phòng
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findByIdAndDelete(id);
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });

    res.json({ message: "Xóa phòng thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả phòng với pagination
exports.getAllRooms = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const totalRooms = await Room.countDocuments();
      const rooms = await Room.find().skip(skip).limit(limit);
  
      res.json({
        rooms,
        totalPages: Math.ceil(totalRooms / limit),
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };