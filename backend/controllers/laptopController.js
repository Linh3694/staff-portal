const Laptop = require("../models/Laptop");
const User = require("../models/Users");
const Room = require("../models/Room")
const mongoose = require("mongoose");
const Notification = require('../models/notification'); 

// Lấy danh sách laptop
exports.getLaptops = async (req, res) => {
  try {
    // Lấy danh sách laptop từ database
    const laptops = await Laptop.find()
    .populate("assigned", "fullname jobTitle department") // Populate thông tin người dùng
    .populate("room", "name location") // Populate thông tin phòng
    .lean(); // Sử dụng `.lean()` để trả về plain objects
    console.log(`Fetched ${laptops.length} laptops.`);

    // Gắn thông tin "assigned" vào từng laptop
    const populatedLaptops = laptops.map((laptop) => ({
      ...laptop,
      assigned: laptop.assigned || [], // Dữ liệu từ populate đã có
      room: laptop.room || { name: "Không xác định", location: "Không xác định" }, // Gắn giá trị mặc định nếu room null
    }));

    // Trả về danh sách laptop đã được populate
    res.status(200).json(populatedLaptops);
  } catch (error) {
    console.error("Error fetching laptops:", error.message);
    res.status(500).json({ message: "Error fetching laptops", error: error.message });
  }
};

// Thêm mới laptop
exports.createLaptop = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, manufacturer, serial, assigned, status, specs, type, room } = req.body;
    const userId = req.body.userId || req.headers["user-id"];

    if (!name || !manufacturer || !serial) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

    if (!specs || typeof specs !== "object") {
      return res.status(400).json({ message: "Thông tin specs không hợp lệ!" });
    }

    // Kiểm tra `assigned` không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    // Kiểm tra `room` nếu có
    if (room && !mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ message: "Room ID không hợp lệ!" });
    }

    const laptop = new Laptop({ name, manufacturer, serial, assigned, specs, status, type, room });
    await laptop.save();

    // Tạo thông báo khi tạo mới laptop
    const user = await User.findById(userId);
    if (user) {
      const notification = new Notification({
        message: `Laptop mới "${name}" đã được thêm bởi ${user.fullname}.`,
        type: "info",
      });
      await notification.save();
    }

    res.status(201).json(laptop);
  } catch (error) {
    console.error("Error creating laptop:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm laptop", error: error.message });
  }
};

exports.updateLaptop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, specs, type, room } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    // Kiểm tra `room` nếu có
    if (room && !mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ message: "Room ID không hợp lệ!" });
    }

    const laptop = await Laptop.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, specs, type, room },
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy laptop" });
    }

    res.json(laptop);
  } catch (error) {
    console.error("Error updating laptop:", error.message);
    res.status(400).json({ message: "Error updating laptop", error: error.message });
  }
};

// Xóa laptop
exports.deleteLaptop = async (req, res) => {
  try {
    await Laptop.findByIdAndDelete(req.params.id);
    res.json({ message: "Laptop deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting laptop", error });
  }
};

exports.bulkUploadLaptops = async (req, res) => {
  try {
    const { laptops } = req.body;

    if (!laptops || !Array.isArray(laptops) || laptops.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }

    const errors = [];
    const validLaptops = [];

    for (const laptop of laptops) {
      try {
        // Xử lý `assigned`
        if (laptop.assigned && Array.isArray(laptop.assigned)) {
          const isId = mongoose.Types.ObjectId.isValid(laptop.assigned[0]);
          if (isId) {
            // Nếu là ID, kiểm tra sự tồn tại
            const validIds = await User.find({ _id: { $in: laptop.assigned } }).select("_id");
            if (validIds.length !== laptop.assigned.length) {
              throw new Error("Một số ID người dùng không tồn tại trong hệ thống.");
            }
          } else {
            // Nếu là fullname, ánh xạ sang ID
            const assignedIds = await Promise.all(
              laptop.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname: fullname.trim() }).select("_id");
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            laptop.assigned = assignedIds;
          }
        }

        // Kiểm tra room
        if (laptop.room && !mongoose.Types.ObjectId.isValid(laptop.room)) {
          throw new Error(`Room ID "${laptop.room}" không hợp lệ.`);
        }

        // Kiểm tra thông tin laptop
        if (!laptop.name || !laptop.manufacturer || !laptop.serial) {
          errors.push({
            serial: laptop.serial || "Không xác định",
            message: "Thông tin laptop không hợp lệ (thiếu tên, nhà sản xuất hoặc serial).",
          });
          continue;
        }

        // Kiểm tra trùng lặp serial
        const existingLaptop = await Laptop.findOne({ serial: laptop.serial });
        if (existingLaptop) {
          errors.push({
            serial: laptop.serial,
            name: laptop.name,
            message: `Serial ${laptop.serial} đã tồn tại.`,
          });
          continue;
        }

        validLaptops.push(laptop);
      } catch (error) {
        errors.push({
          serial: laptop.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý laptop.",
        });
      }
    }

    if (validLaptops.length > 0) {
      await Laptop.insertMany(validLaptops);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedLaptops: validLaptops.length,
      errors,
    });
  } catch (error) {
    console.error("Lỗi khi thêm mới hàng loạt:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm mới hàng loạt", error: error.message });
  }
};


/// Repair Log
exports.addRepairLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, date, updatedBy, details } = req.body; // Lấy thông tin từ request

    const repairLog = { description, date, details, updatedBy };

    const laptop = await Laptop.findById(id);
    if (!laptop) {
      return res.status(404).json({ message: "Laptop not found" });
    }

    laptop.repairs.push(repairLog); // Thêm nhật ký sửa chữa
    await laptop.save(); // Lưu thay đổi vào cơ sở dữ liệu

    res.status(201).json(repairLog); // Trả về nhật ký sửa chữa vừa được thêm
  } catch (error) {
    console.error("Error adding repair log:", error);
    res.status(500).json({ message: "Failed to add repair log" });
  }
};