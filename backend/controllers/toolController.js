const Tool = require("../models/Tool");
const User = require("../models/Users");
const mongoose = require("mongoose");
const Notification = require('../models/notification'); 

// Lấy danh sách Tool
exports.getTools = async (req, res) => {
  try {
    // Lấy danh sách tool từ database
    const tool = await Tool.find()
    .populate('room')
    .lean(); // Sử dụng `.lean()` để trả về plain objects
    console.log(`Fetched ${Tool.length} Tool.`);

    // Lấy tất cả ID từ trường "assigned" trong các Tool
    const allAssignedIds = tool
      .filter((tool) => Array.isArray(tool.assigned))
      .flatMap((tool) => tool.assigned);

    // Truy vấn thông tin tất cả người dùng liên quanxá
    const users = await User.find({ _id: { $in: allAssignedIds } }).lean();
    console.log(`Fetched ${users.length} users for assigned tool.`);

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

    // Gắn thông tin "assigned" vào từng tool
    const populatedtool = tool.map((tool) => ({
      ...tool,
      assigned: (tool.assigned || [])
        .map((userId) => usersById[userId] || null) // Nếu không tìm thấy user, trả về null
        .filter(Boolean), // Loại bỏ giá trị null
    }));

    // Trả về danh sách tool đã được populate
    res.status(200).json(populatedtool);
  } catch (error) {
    console.error("Error fetching tool:", error.message);
    res.status(500).json({ message: "Error fetching tool", error: error.message });
  }
};

// Thêm mới tool
exports.createTools = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log dữ liệu nhận từ frontend

    const { name, manufacturer, serial, assigned, status, type } = req.body;
    const userId = req.body.userId || req.headers['user-id'];

    if (!name) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }


    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const tool = new Tool({ name, manufacturer, serial, assigned, status, type });
    await tool.save();

      
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          const userFullname = user.fullname; // Lấy fullname của người dùng
          const notification = new Notification({
            message: `tool mới "${name}" đã được thêm bởi ${userFullname}.`,
            type: 'info',
          });
          await notification.save(); // Lưu thông báo vào database

    res.status(201).json(tool);
  } catch (error) {
    console.error("Error creating tool:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm tool", error: error.message });
  }
};

exports.updateTools = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, type, room } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const tool = await Tool.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, type, room  },
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!tool) {
      return res.status(404).json({ message: "Không tìm thấy tool" });
    }

    res.json(tool);
  } catch (error) {
    console.error("Error updating tool:", error.message);
    res.status(400).json({ message: "Error updating tool", error: error.message });
  }
};

// Xóa tool
exports.deleteTools = async (req, res) => {
  try {
    await Tool.findByIdAndDelete(req.params.id);
    res.json({ message: "Tool deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting Tool", error });
  }
};

exports.bulkUploadtool = async (req, res) => {
  try {
    const { tool } = req.body;

    // Kiểm tra dữ liệu nhận được
    if (!tool || !Array.isArray(tool) || tool.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }

    const errors = []; // Danh sách lỗi
    const validtool = []; // Danh sách tool hợp lệ

    // Xử lý từng tool trong danh sách
    for (const tool of tool) {
      try {
        // Chuyển đổi `assigned` từ fullname sang ObjectId
        if (tool.assigned && Array.isArray(tool.assigned)) {
          const isObjectId = mongoose.Types.ObjectId.isValid(tool.assigned[0]);
          if (!isObjectId) {
            const assignedIds = await Promise.all(
              tool.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname }).select('_id');
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            tool.assigned = assignedIds;
          }
        }

        // Kiểm tra thông tin bắt buộc
        if (!tool.name || !tool.manufacturer || !tool.serial) {
          errors.push({
            serial: tool.serial || "Không xác định",
            message: "Thông tin tool không hợp lệ (thiếu tên, nhà sản xuất hoặc serial).",
          });
          continue; // Bỏ qua tool này
        }

        // Kiểm tra serial đã tồn tại
        const existingTool = await Tool.findOne({ serial: tool.serial });
        if (existingTool) {
          errors.push({
            serial: tool.serial,
            name: tool.name,
            message: `Serial ${tool.serial} đã tồn tại.`,
          });
          continue; // Bỏ qua tool này
        }

        // Nếu hợp lệ, thêm vào danh sách
        validtool.push(tool);
      } catch (error) {
        // Bắt lỗi trong quá trình xử lý từng tool
        errors.push({
          serial: tool.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý tool.",
        });
      }
    }

    // Nếu có lỗi, trả về danh sách lỗi
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Dữ liệu có lỗi",
        errors, // Danh sách lỗi
        addedtool: validtool.length, // Số lượng tool hợp lệ
      });
    }

    // Thêm các tool hợp lệ vào database
    if (validtool.length > 0) {
      await Tool.insertMany(validtool);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedtool: validtool.length, // Số lượng tool được thêm thành công
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

    const tool = await Tool.findById(id);
    if (!tool) {
      return res.status(404).json({ message: "tool not found" });
    }

    tool.repairs.push(repairLog); // Thêm nhật ký sửa chữa
    await tool.save(); // Lưu thay đổi vào cơ sở dữ liệu

    res.status(201).json(repairLog); // Trả về nhật ký sửa chữa vừa được thêm
  } catch (error) {
    console.error("Error adding repair log:", error);
    res.status(500).json({ message: "Failed to add repair log" });
  }
};