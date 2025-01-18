const Event = require("../models/Events");

// Lấy danh sách tất cả các sự kiện
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách sự kiện!" });
  }
};

// Lấy chi tiết một sự kiện theo ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện!" });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết sự kiện!" });
  }
};

exports.createEvent = async (req, res) => {
  try {
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { name, description, startDate, endDate, number } = req.body;
    const image = req.file ? `/uploads/Events/${req.file.filename}` : undefined; // Lưu đường dẫn tương đối

    if (!name || !description) {
      return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc: name hoặc description!" });
    }

    // Lưu sự kiện vào MongoDB
    const newEvent = new Event({
      name,
      description,
      image,
      startDate,
      endDate,
      number,
    });
    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Lỗi khi tạo sự kiện!" });
  }
};

// Cập nhật thông tin sự kiện
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, description, startDate, endDate, number } = req.body;
  const image = req.file ? `/uploads/Events/${req.file.filename}` : undefined;

  try {
    const updateData = { name, description, startDate, endDate, number };
    if (image) {
      updateData.image = image; // Cập nhật đường dẫn ảnh mới
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, { new: true });
    if (!updatedEvent) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện để cập nhật!" });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật sự kiện!" });
  }
};

// Xóa sự kiện
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện để xóa!" });
    }
    res.status(200).json({ message: "Xóa sự kiện thành công!" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Lỗi khi xóa sự kiện!" });
  }
};

// Fetch sự kiện bằng slug
exports.getEventBySlug = async (req, res) => {
  const { slug } = req.query;
  try {
    const event = await Event.findOne({ slug });
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi tìm kiếm sự kiện" });
  }
};