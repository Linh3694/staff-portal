const Projector = require("../models/Projector");
const User = require("../models/Users");
const mongoose = require("mongoose");
const Notification = require('../models/notification'); 

// Lấy danh sách Projector
exports.getProjectors = async (req, res) => {
  try {
    // Lấy danh sách Projector từ database
    const projectors = await Projector.find()
    .lean(); // Sử dụng `.lean()` để trả về plain objects
    console.log(`Fetched ${projectors.length} projectors.`);

    // Lấy tất cả ID từ trường "assigned" trong các projector
    const allAssignedIds = projectors
      .filter((projector) => Array.isArray(projector.assigned))
      .flatMap((projector) => projector.assigned);

    // Truy vấn thông tin tất cả người dùng liên quan
    const users = await User.find({ _id: { $in: allAssignedIds } }).lean();
    console.log(`Fetched ${users.length} users for assigned projectors.`);

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

    // Gắn thông tin "assigned" vào từng projector
    const populatedProjectors = projectors.map((projector) => ({
      ...projector,
      assigned: (projector.assigned || [])
        .map((userId) => usersById[userId] || null) // Nếu không tìm thấy user, trả về null
        .filter(Boolean), // Loại bỏ giá trị null
    }));

    // Trả về danh sách projector đã được populate
    res.status(200).json(populatedProjectors);
  } catch (error) {
    console.error("Error fetching Projectors:", error.message);
    res.status(500).json({ message: "Error fetching Projectors", error: error.message });
  }
};

// Thêm mới Projector
exports.createProjector = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log dữ liệu nhận từ frontend

    const { name, manufacturer, serial, assigned, status, type } = req.body;
    const userId = req.body.userId || req.headers['user-id'];

    if (!name || !manufacturer || !serial) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const projector = new Projector({ name, manufacturer, serial, assigned, status, type });
    await projector.save();

      
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          const userFullname = user.fullname; // Lấy fullname của người dùng
          const notification = new Notification({
            message: `projector mới "${name}" đã được thêm bởi ${userFullname}.`,
            type: 'info',
          });
          await notification.save(); // Lưu thông báo vào database

    res.status(201).json(projector);
  } catch (error) {
    console.error("Error creating projector:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm projector", error: error.message });
  }
};

exports.updateProjector = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, specs, type } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const projector = await Projector.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, specs, type  },
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!projector) {
      return res.status(404).json({ message: "Không tìm thấy projector" });
    }

    res.json(projector);
  } catch (error) {
    console.error("Error updating projector:", error.message);
    res.status(400).json({ message: "Error updating projector", error: error.message });
  }
};

// Xóa projector
exports.deleteProjector = async (req, res) => {
  try {
    await Projector.findByIdAndDelete(req.params.id);
    res.json({ message: "Projector deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting Projector", error });
  }
};

exports.bulkUploadProjectors = async (req, res) => {
  try {
    const { projectors } = req.body;

    // Kiểm tra dữ liệu nhận được
    if (!projectors || !Array.isArray(projectors) || projectors.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }

    const errors = []; // Danh sách lỗi
    const validProjectors = []; // Danh sách Projector hợp lệ

    // Xử lý từng Projector trong danh sách
    for (const projector of projectors) {
      try {
        // Chuyển đổi `assigned` từ fullname sang ObjectId
        if (projector.assigned && Array.isArray(projector.assigned)) {
          const isObjectId = mongoose.Types.ObjectId.isValid(projector.assigned[0]);
          if (!isObjectId) {
            const assignedIds = await Promise.all(
              projector.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname }).select('_id');
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            projector.assigned = assignedIds;
          }
        }

        // Kiểm tra thông tin bắt buộc
        if (!projector.name || !projector.manufacturer || !projector.serial) {
          errors.push({
            serial: projector.serial || "Không xác định",
            message: "Thông tin projector không hợp lệ (thiếu tên, nhà sản xuất hoặc serial).",
          });
          continue; // Bỏ qua projector này
        }

        // Kiểm tra serial đã tồn tại
        const existingProjector = await Projector.findOne({ serial: projector.serial });
        if (existingProjector) {
          errors.push({
            serial: projector.serial,
            name: projector.name,
            message: `Serial ${projector.serial} đã tồn tại.`,
          });
          continue; // Bỏ qua projector này
        }

        // Nếu hợp lệ, thêm vào danh sách
        validProjectors.push(projector);
      } catch (error) {
        // Bắt lỗi trong quá trình xử lý từng projector
        errors.push({
          serial: projector.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý projector.",
        });
      }
    }

    // Nếu có lỗi, trả về danh sách lỗi
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Dữ liệu có lỗi",
        errors, // Danh sách lỗi
        addedProjectors: validProjectors.length, // Số lượng Projector hợp lệ
      });
    }

    // Thêm các Projector hợp lệ vào database
    if (validProjectors.length > 0) {
      await Projector.insertMany(validProjectors);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedProjectors: validProjectors.length, // Số lượng Projector được thêm thành công
    });
  } catch (error) {
    console.error("Lỗi khi thêm mới hàng loạt:", error.message);
    res.status(500).json({
      message: "Lỗi khi thêm mới hàng loạt",
      error: error.message,
    });
  }
};


/// Repair Log
exports.addRepairLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, date, updatedBy, details } = req.body; // Lấy thông tin từ request

    const repairLog = { description, date, details, updatedBy };

    const projector = await Projector.findById(id);
    if (!projector) {
      return res.status(404).json({ message: "projector not found" });
    }

    projector.repairs.push(repairLog); // Thêm nhật ký sửa chữa
    await projector.save(); // Lưu thay đổi vào cơ sở dữ liệu

    res.status(201).json(repairLog); // Trả về nhật ký sửa chữa vừa được thêm
  } catch (error) {
    console.error("Error adding repair log:", error);
    res.status(500).json({ message: "Failed to add repair log" });
  }
};