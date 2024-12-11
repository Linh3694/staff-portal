const Desktop = require("../models/Desktop");
const User = require("../models/Clients");
const mongoose = require("mongoose");

// Lấy danh sách desktop
exports.getDesktops = async (req, res) => {
  try {
    const desktops = await Desktop.find().lean();
    console.log("Desktops:", desktops); // Log để kiểm tra dữ liệu

    const populatedDesktops = await Promise.all(
      desktops.map(async (desktop) => {
        const assignedArray = Array.isArray(desktop.assigned) ? desktop.assigned : [];
        const assignedUsers = await User.find({ _id: { $in: assignedArray } });
        const assignedFormatted = assignedUsers.map((user) => ({
          _id: user._id,
          name: user.name,
          jobTitle: user.jobTitle, // Đảm bảo jobTitle có trong model Clients
        }));

        return { ...desktop, assigned: assignedFormatted };
      })
    );

    res.status(200).json(populatedDesktops);
  } catch (error) {
    console.error("Error fetching desktops:", error.message);
    res.status(500).json({ message: "Error fetching desktops", error: error.message });
  }
};

// Thêm mới desktop
exports.createDesktop = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, manufacturer, serial, assigned, status, specs } = req.body;

    if (!name || !manufacturer || !serial) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

    if (!specs || typeof specs !== "object") {
      return res.status(400).json({ message: "Thông tin specs không hợp lệ!" });
    }

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const desktop = new Desktop({ name, manufacturer, serial, assigned, specs, status });
    await desktop.save();

    res.status(201).json(desktop);
  } catch (error) {
    console.error("Error creating desktop:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm desktop", error: error.message });
  }
};

// Cập nhật desktop
exports.updateDesktop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, specs } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const desktop = await Desktop.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, specs },
      { new: true }
    );

    if (!desktop) {
      return res.status(404).json({ message: "Không tìm thấy desktop" });
    }

    res.json(desktop);
  } catch (error) {
    console.error("Error updating desktop:", error.message);
    res.status(400).json({ message: "Error updating desktop", error: error.message });
  }
};

// Xóa desktop
exports.deleteDesktop = async (req, res) => {
  try {
    await Desktop.findByIdAndDelete(req.params.id);
    res.json({ message: "Desktop deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting desktop", error });
  }
};

// Upload hàng loạt desktops
exports.bulkUploadDesktops = async (req, res) => {
  try {
    const { desktops } = req.body;

    // Kiểm tra dữ liệu nhận được
    if (!desktops || !Array.isArray(desktops) || desktops.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }
    const validStatuses = ["Active", "In Repair", "Lưu kho"];
    const errors = [];
    const validDesktops = [];

    for (const desktop of desktops) {
      if (!desktop.name || !desktop.manufacturer || !desktop.serial) {
        errors.push({
          serial: desktop.serial || "Không xác định",
          message: `Thông tin desktop không hợp lệ.`,
        });
        continue;
      }

      // Kiểm tra serial đã tồn tại trong database
      const existingDesktop = await Desktop.findOne({ serial: desktop.serial });
      if (existingDesktop) {
        errors.push({
          serial: desktop.serial,
          name: desktop.name,
          message: `Serial ${desktop.serial} đã tồn tại.`,
        });
        continue;
      }

      // Chuẩn hóa trạng thái
        const normalizedStatus = validStatuses.includes(desktop.status)
        ? desktop.status
        : "Không xác định";

        validDesktops.push({
        ...desktop,
        status: normalizedStatus, // Gán trạng thái hợp lệ hoặc mặc định
        });
    }

    // Trả về danh sách lỗi nếu có lỗi
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Dữ liệu có lỗi",
        errors, // Danh sách các serial bị trùng
        addedDesktops: validDesktops.length,
      });
    }

    // Thêm các desktops hợp lệ vào database
    if (validDesktops.length > 0) {
      await Desktop.insertMany(validDesktops);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedDesktops: validDesktops.length,
    });
  } catch (error) {
    console.error("Lỗi khi thêm mới hàng loạt:", error);
    res.status(500).json({
      message: "Lỗi khi thêm mới hàng loạt",
      error: error.message,
    });
  }
};

// Thêm nhật ký sửa chữa cho desktop
exports.addRepairLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, date, updatedBy } = req.body;

    const repairLog = { description, date, updatedBy };

    const desktop = await Desktop.findById(id);
    if (!desktop) {
      return res.status(404).json({ message: "Desktop not found" });
    }

    desktop.repairs.push(repairLog);
    await desktop.save();

    res.status(201).json(repairLog);
  } catch (error) {
    console.error("Error adding repair log:", error);
    res.status(500).json({ message: "Failed to add repair log" });
  }
};