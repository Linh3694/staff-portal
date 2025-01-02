const Tool = require("../models/Tool");
const User = require("../models/Users");
const Room = require("../models/Room")
const mongoose = require("mongoose");
const Notification = require('../models/notification'); 

// Lấy danh sách tool
exports.getTools = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query; // Nhận tham số phân trang
    const skip = (page - 1) * limit;

    // Lấy tổng số record để tính tổng số trang
    const totalRecords = await Tool.countDocuments();
    const totalPages = Math.ceil(totalRecords / limit);
    // Lấy danh sách tool từ database
    const tools = await Tool.find()
    .skip(skip)
    .limit(Number(limit))
    .populate("assigned", "fullname jobTitle department avatarUrl") // Populate thông tin người dùng
    .populate("room", "name location status") // Populate thông tin phòng
    .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl") // Thêm jobTitle
    .populate("assignmentHistory.assignedBy", "fullname email title") // Populate thông tin assignedBy
    .populate("assignmentHistory.revokedBy", "fullname email") // Populate thông tin revokedBy
    .lean(); // Sử dụng `.lean()` để trả về plain objects
    console.log(tools);

    // Gắn thông tin "assigned" vào từng tool
    const populatedTools = tools.map((tool) => ({
      ...tool,
      assigned: tool.assigned || [], // Dữ liệu từ populate đã có
      room: tool.room
  ? {
      ...tool.room,
      location: tool.room.location?.map(
        (loc) => `${loc.building}, tầng ${loc.floor}`
      ) || ["Không xác định"],
    }
  : { name: "Không xác định", location: ["Không xác định"] }, // Gắn giá trị mặc định nếu room null
    }));

    // Trả về danh sách tool đã được populate
    res.status(200).json({
      populatedTools,
      totalPages,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching tools:", error.message);
    res.status(500).json({ message: "Error fetching tools", error: error.message });
  }
};

// Thêm mới tool
exports.createTool = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, manufacturer, serial, assigned, status, specs, room, reason } = req.body;
    
    if (!name || !serial) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

    if (!specs || typeof specs !== "object") {
      return res.status(400).json({ message: "Thông tin specs không hợp lệ!" });
    }

     // Kiểm tra `serial` trùng lặp
     const existingTool = await Tool.findOne({ serial });
     if (existingTool) {
       return res.status(400).json({ message: `Serial "${serial}" đã tồn tại trong hệ thống.` });
     }

    // Kiểm tra `assigned` không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    // Kiểm tra `room` nếu có
    if (room && !mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ message: "Room ID không hợp lệ!" });
    }

    if (status === "Broken" && !reason) {
      return res.status(400).json({ message: "Lý do báo hỏng là bắt buộc khi trạng thái là 'Broken'!" });
    }

    // Kiểm tra `room` nếu có
    if (room && !mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ message: "Room ID không hợp lệ!" });
    }

    if (status && !["Active", "Standby", "Broken", "PendingDocumentation"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }
    // Kiểm tra `status` và thiết lập giá trị mặc định


    const tool = new Tool({ name, manufacturer, serial, assigned, specs, status, room, reason: status === "Broken" ? reason : undefined, });
    
    await tool.save();

   
    res.status(201).json(tool);
  } catch (error) {
    console.error("Error creating tool:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm tool", error: error.message });
  }
};

exports.updateTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, specs, room, reason } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    // Kiểm tra `room` nếu có
    if (room && !mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ message: "Room ID không hợp lệ!" });
    }

    const tool = await Tool.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, specs, room, reason: status === "Broken" ? reason : undefined, },
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
exports.deleteTool = async (req, res) => {
  try {
    await Tool.findByIdAndDelete(req.params.id);
    res.json({ message: "Tool deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting tool", error });
  }
};

exports.bulkUploadTools = async (req, res) => {
  try {
    const { tools } = req.body;
    console.log("Tools:", tools);
    if (!tools || !Array.isArray(tools) || tools.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }
    

    const errors = [];
    const validTools = [];

    for (const tool of tools) {
      try {
        // Kiểm tra `room` và xử lý giá trị không hợp lệ
        // Thiết lập giá trị mặc định nếu thiếu
        tool.room = tool.room && mongoose.Types.ObjectId.isValid(tool.room) ? tool.room : null;
        tool.status = ["Active", "Standby", "Broken", "PendingDocumentation"].includes(tool.status)
          ? tool.status
          : "Standby";
        // Kiểm tra `status` và thiết lập giá trị mặc định
        if (!["Active", "Standby", "Broken", "PendingDocumentation"].includes(tool.status)) {
          console.warn(`Status không hợp lệ: ${tool.status}. Thiết lập giá trị 'Standby'.`);
          tool.status = "Standby"; // Gán giá trị mặc định
        }
        // Xử lý `assigned`
        if (tool.assigned && Array.isArray(tool.assigned)) {
          const isId = mongoose.Types.ObjectId.isValid(tool.assigned[0]);
          if (isId) {
            // Nếu là ID, kiểm tra sự tồn tại
            const validIds = await User.find({ _id: { $in: tool.assigned } }).select("_id");
            if (validIds.length !== tool.assigned.length) {
              throw new Error("Một số ID người dùng không tồn tại trong hệ thống.");
            }
          } else {
            // Nếu là fullname, ánh xạ sang ID
            const assignedIds = await Promise.all(
              tool.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname: fullname.trim() }).select("_id");
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            tool.assigned = assignedIds;
          }
        }

        // Kiểm tra room
        if (tool.room && !mongoose.Types.ObjectId.isValid(tool.room)) {
          throw new Error(`Room ID "${tool.room}" không hợp lệ.`);
        }

        // Kiểm tra thông tin tool
        if (!tool.name || !tool.serial) {
          errors.push({
            serial: tool.serial || "Không xác định",
            message: "Thông tin tool không hợp lệ (thiếu tên, serial).",
          });
          continue;
        }

        // Kiểm tra trùng lặp serial
        const existingTool = await Tool.findOne({ serial: tool.serial });
        if (existingTool) {
          errors.push({
            serial: tool.serial,
            name: tool.name,
            message: `Serial ${tool.serial} đã tồn tại.`,
          });
          continue;
        }

        validTools.push(tool);
      } catch (error) {
        errors.push({
          serial: tool.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý tool.",
        });
      }
    }

    if (validTools.length > 0) {
      await Tool.insertMany(validTools);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedTools: validTools.length,
      errors,
    });
  } catch (error) {
    console.error("Lỗi khi thêm mới hàng loạt:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm mới hàng loạt", error: error.message });
  }
};

// controllers/toolController.js
exports.assignTool = async (req, res) => {
  try {
    const { id } = req.params;         // toolId
    const { newUserId, notes } = req.body;

    const tool = await Tool.findById(id).populate("assigned");
    if (!tool) {
      return res.status(404).json({ message: "Không tìm thấy tool" });
    }
    // Đảm bảo tất cả các bản ghi trước đó có `endDate`
    tool.assignmentHistory.forEach((entry) => {
      if (!entry.endDate) {
        entry.endDate = new Date();
      }
    });
    // Lấy thông tin người thực hiện từ token
    const currentUser = req.user; // Nếu bạn có middleware xác thực
    console.log("Current User:", req.user);

    // Đóng lịch sử sử dụng trước đó (nếu có)
    if (tool.assigned?.length > 0) {
      const oldUserId = tool.assigned[0]._id;
      const lastHistory = tool.assignmentHistory.find(
        (h) => h.user.toString() === oldUserId.toString() && !h.endDate
      );
      if (lastHistory) {
        lastHistory.endDate = new Date();
        lastHistory.revokedBy = currentUser._id; // Ghi lại người thu hồi
      }
    }

    // Tìm user mới
    const newUser = await User.findById(newUserId);
    if (!newUser) {
      return res.status(404).json({ message: "Không tìm thấy user mới" });
    }
    console.log(newUser);

    // Thêm record vào assignmentHistory
    tool.assignmentHistory.push({
      user: newUser._id,
      userName: newUser.fullname,
      startDate: new Date(),
      notes: notes || "",
      assignedBy: currentUser.id,
      jobTitle: newUser.jobTitle || "Không xác định", // Thêm jobTitle
    });

    // Cập nhật currentHolder
    tool.currentHolder = {
      id: newUser._id,
      fullname: newUser.fullname,
      jobTitle: newUser.jobTitle,
      department: newUser.department,
      avatarUrl: newUser.avatarUrl,
    };

    // Cập nhật assigned
    tool.assigned = [newUser._id];
    tool.status = "PendingDocumentation"; // tuỳ logic
    await tool.save();

    // Populate thông tin người dùng
    const populatedTool = await tool.populate({
      path: "assignmentHistory.user",
      select: "fullname jobTitle avatarUrl",
    });
    
    res.status(200).json(
      populatedTool);
  } catch (error) {
    console.error("Lỗi assignTool:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// controllers/toolController.js
exports.revokeTool = async (req, res) => {
  try {
    const { id } = req.params;
    const { revokedBy, reasons, status } = req.body;

    const tool = await Tool.findById(id).populate("assigned");
    if (!tool) {
      return res.status(404).json({ message: "Tool không tồn tại" });
    }

    const currentUser = req.user; // Người thực hiện thu hồi

    if (tool.assigned.length > 0) {
      const oldUserId = tool.assigned[0]._id;
      const lastHistory = tool.assignmentHistory.find(
        (hist) => hist.user?.toString() === oldUserId.toString() && !hist.endDate
      );
      if (lastHistory) {
        lastHistory.endDate = new Date();
        lastHistory.revokedBy = currentUser.id; // Ghi lại người thu hồi
        lastHistory.revokedReason = reasons; // Ghi lý do thu hồi vào bản ghi hiện tại
      }
    } else {
      // Nếu không có bản ghi nào đang mở, thêm một bản ghi mới
      tool.assignmentHistory.push({
        revokedBy,
        revokedReason: reasons,
        endDate: new Date(),
      });
    }

    // Cập nhật trạng thái thiết bị
    tool.status = status || "Standby"; // Hoặc trạng thái bạn mong muốn
    tool.currentHolder = null; // Xóa người đang giữ tool
    tool.assigned = [];
    await tool.save();

    res.status(200).json({ message: "Thu hồi thành công", tool });
  } catch (error) {
    console.error("Lỗi revokeTool:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

exports.updateToolStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, brokenReason } = req.body;

      if (!["Active", "Standby", "Broken", "PendingDocumentation"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }
      if (status === "Broken" && !brokenReason) {
        return res.status(400).json({ error: "Lý do báo hỏng là bắt buộc!" });
      }    

      try {
        const tool = await Tool.findById(id);
        if (!tool) {
          return res.status(404).json({ message: "Không tìm thấy thiết bị" });
        }
    
        // Lưu lý do báo hỏng vào `reason`
        if (status === "Broken") {
          tool.brokenReason = brokenReason || "Không xác định";
        }
    
        tool.status = status;
        await tool.save();
    
        res.status(200).json(tool);
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error });
      }
  } catch (error) {
    console.error("Lỗi updateToolStatus:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
