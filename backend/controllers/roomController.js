const Room = require("../models/Room");

// Lấy tất cả phòng
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().lean();
    res.json({
      rooms: rooms.map((room) => ({
        ...room,
        location: room.location?.map(loc => `${loc.building} - Tầng ${loc.floor}`).join(", ") || "Chưa xác định",
      })),
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Thêm phòng mới
exports.addRoom = async (req, res) => {
  try {
    const { name, location, capacity, status } = req.body;

    if (!name || !location || !location.length || !capacity || !status) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc" });
    }

    const newRoom = new Room({ name, location, capacity, status });
    await newRoom.save();

    res.status(201).json({ message: "Thêm phòng thành công!" });
  } catch (error) {
    console.error("Lỗi khi thêm phòng:", error);
    res.status(500).json({ message: "Lỗi server", error });
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
        const rooms = await Room.find();
        res.json({ rooms });
      } catch (error) {
        console.error("Lỗi khi lấy danh sách phòng:", error.message);
        res.status(500).json({ message: "Có lỗi xảy ra khi lấy danh sách phòng." });
      }
  };

  // Lấy chi tiết một phòng
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id).lean();
    if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });

    res.json({
      ...room,
      location: room.location?.map((loc) => `${loc.building} - Tầng ${loc.floor}`).join(", ") || "Chưa xác định",
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết phòng:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};