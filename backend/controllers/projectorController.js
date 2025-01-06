const Projector = require("../models/Projector");
const User = require("../models/Users");
const Room = require("../models/Room")
const mongoose = require("mongoose");
const Notification = require('../models/notification'); 

// Lấy danh sách projector
exports.getProjectors = async (req, res) => {
  try {
    const projectors = await Projector.find()
      .sort({ createdAt: -1 })  // sắp xếp giảm dần theo createdAt
      .populate("assigned", "fullname jobTitle department avatarUrl")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email title")
      .populate("assignmentHistory.revokedBy", "fullname email")
      .lean();

    // Nếu vẫn muốn reshape (thêm field `location` dạng string), bạn làm như cũ:
    const populatedProjectors = projectors.map((projector) => ({
      ...projector,
      room: projector.room
        ? {
            ...projector.room,
            location:
              projector.room.location?.map(
                (loc) => `${loc.building}, tầng ${loc.floor}`
              ) || ["Không xác định"],
          }
        : { name: "Không xác định", location: ["Không xác định"] },
    }));

    // Trả về *toàn bộ* mà không kèm totalPages/currentPage
    return res.status(200).json({
      populatedProjectors,
    });
  } catch (error) {
    console.error("Error fetching projectors:", error.message);
    return res.status(500).json({
      message: "Error fetching projectors",
      error: error.message,
    });
  }
};

// Thêm mới projector
exports.createProjector = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, manufacturer, serial, assigned, status, type, room, reason } = req.body;
    const userId = req.body.userId || req.headers["user-id"];

    if (!name || !serial) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

     // Kiểm tra `serial` trùng lặp
     const existingProjector = await Projector.findOne({ serial });
     if (existingProjector) {
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


    const projector = new Projector({ name, manufacturer, serial, assigned, status, type, room, reason: status === "Broken" ? reason : undefined, });
    
    await projector.save();

    // Tạo thông báo khi tạo mới projector
    const user = await User.findById(userId);
    if (user) {
      const notification = new Notification({
        message: `Projector mới "${name}" đã được thêm bởi ${user.fullname}.`,
        type: "info",
      });
      await notification.save();
    }
   
    res.status(201).json(projector);
  } catch (error) {
    console.error("Error creating projector:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm projector", error: error.message });
  }
};

exports.updateProjector = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, type, room, reason } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    // Kiểm tra `room` nếu có
    if (room && !mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ message: "Room ID không hợp lệ!" });
    }

    const projector = await Projector.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, type, room, reason: status === "Broken" ? reason : undefined, },
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
    res.status(400).json({ message: "Error deleting projector", error });
  }
};

exports.bulkUploadProjectors = async (req, res) => {
  try {
    const { projectors } = req.body;
    console.log("Projectors:", projectors);
    if (!projectors || !Array.isArray(projectors) || projectors.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }
    

    const errors = [];
    const validProjectors = [];

    for (const projector of projectors) {
      try {
        // Kiểm tra `room` và xử lý giá trị không hợp lệ
        // Thiết lập giá trị mặc định nếu thiếu
        projector.room = projector.room && mongoose.Types.ObjectId.isValid(projector.room) ? projector.room : null;
        projector.status = ["Active", "Standby", "Broken", "PendingDocumentation"].includes(projector.status)
          ? projector.status
          : "Standby";
        // Kiểm tra `status` và thiết lập giá trị mặc định
        if (!["Active", "Standby", "Broken", "PendingDocumentation"].includes(projector.status)) {
          console.warn(`Status không hợp lệ: ${projector.status}. Thiết lập giá trị 'Standby'.`);
          projector.status = "Standby"; // Gán giá trị mặc định
        }
        // Xử lý `assigned`
        if (projector.assigned && Array.isArray(projector.assigned)) {
          const isId = mongoose.Types.ObjectId.isValid(projector.assigned[0]);
          if (isId) {
            // Nếu là ID, kiểm tra sự tồn tại
            const validIds = await User.find({ _id: { $in: projector.assigned } }).select("_id");
            if (validIds.length !== projector.assigned.length) {
              throw new Error("Một số ID người dùng không tồn tại trong hệ thống.");
            }
          } else {
            // Nếu là fullname, ánh xạ sang ID
            const assignedIds = await Promise.all(
              projector.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname: fullname.trim() }).select("_id");
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            projector.assigned = assignedIds;
          }
        }

        // Kiểm tra room
        if (projector.room && !mongoose.Types.ObjectId.isValid(projector.room)) {
          throw new Error(`Room ID "${projector.room}" không hợp lệ.`);
        }

        // Kiểm tra thông tin projector
        if (!projector.name || !projector.serial) {
          errors.push({
            serial: projector.serial || "Không xác định",
            message: "Thông tin projector không hợp lệ (thiếu tên, serial).",
          });
          continue;
        }

        // Kiểm tra trùng lặp serial
        const existingProjector = await Projector.findOne({ serial: projector.serial });
        if (existingProjector) {
          errors.push({
            serial: projector.serial,
            name: projector.name,
            message: `Serial ${projector.serial} đã tồn tại.`,
          });
          continue;
        }

        validProjectors.push(projector);
      } catch (error) {
        errors.push({
          serial: projector.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý projector.",
        });
      }
    }

    if (validProjectors.length > 0) {
      await Projector.insertMany(validProjectors);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedProjectors: validProjectors.length,
      errors,
    });
  } catch (error) {
    console.error("Lỗi khi thêm mới hàng loạt:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm mới hàng loạt", error: error.message });
  }
};

// controllers/projectorController.js
exports.assignProjector = async (req, res) => {
  try {
    const { id } = req.params;         // projectorId
    const { newUserId, notes } = req.body;

    const projector = await Projector.findById(id).populate("assigned");
    if (!projector) {
      return res.status(404).json({ message: "Không tìm thấy projector" });
    }
    // Đảm bảo tất cả các bản ghi trước đó có `endDate`
    projector.assignmentHistory.forEach((entry) => {
      if (!entry.endDate) {
        entry.endDate = new Date();
      }
    });
    // Lấy thông tin người thực hiện từ token
    const currentUser = req.user; // Nếu bạn có middleware xác thực
    console.log("Current User:", req.user);

    // Đóng lịch sử sử dụng trước đó (nếu có)
    if (projector.assigned?.length > 0) {
      const oldUserId = projector.assigned[0]._id;
      const lastHistory = projector.assignmentHistory.find(
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
    projector.assignmentHistory.push({
      user: newUser._id,
      userName: newUser.fullname,
      startDate: new Date(),
      notes: notes || "",
      assignedBy: currentUser.id,
      jobTitle: newUser.jobTitle || "Không xác định", // Thêm jobTitle
    });

    // Cập nhật currentHolder
    projector.currentHolder = {
      id: newUser._id,
      fullname: newUser.fullname,
      jobTitle: newUser.jobTitle,
      department: newUser.department,
      avatarUrl: newUser.avatarUrl,
    };

    // Cập nhật assigned
    projector.assigned = [newUser._id];
    projector.status = "PendingDocumentation"; // tuỳ logic
    await projector.save();

    // Populate thông tin người dùng
    const populatedProjector = await projector.populate({
      path: "assignmentHistory.user",
      select: "fullname jobTitle avatarUrl",
    });
    
    res.status(200).json(
      populatedProjector);
  } catch (error) {
    console.error("Lỗi assignProjector:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// controllers/projectorController.js
exports.revokeProjector = async (req, res) => {
  try {
    const { id } = req.params;
    const { revokedBy, reasons, status } = req.body;

    const projector = await Projector.findById(id).populate("assigned");
    if (!projector) {
      return res.status(404).json({ message: "Projector không tồn tại" });
    }

    const currentUser = req.user; // Người thực hiện thu hồi

    if (projector.assigned.length > 0) {
      const oldUserId = projector.assigned[0]._id;
      const lastHistory = projector.assignmentHistory.find(
        (hist) => hist.user?.toString() === oldUserId.toString() && !hist.endDate
      );
      if (lastHistory) {
        lastHistory.endDate = new Date();
        lastHistory.revokedBy = currentUser.id; // Ghi lại người thu hồi
        lastHistory.revokedReason = reasons; // Ghi lý do thu hồi vào bản ghi hiện tại
      }
    } else {
      // Nếu không có bản ghi nào đang mở, thêm một bản ghi mới
      projector.assignmentHistory.push({
        revokedBy,
        revokedReason: reasons,
        endDate: new Date(),
      });
    }

    // Cập nhật trạng thái thiết bị
    projector.status = status || "Standby"; // Hoặc trạng thái bạn mong muốn
    projector.currentHolder = null; // Xóa người đang giữ projector
    projector.assigned = [];
    await projector.save();

    res.status(200).json({ message: "Thu hồi thành công", projector });
  } catch (error) {
    console.error("Lỗi revokeProjector:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

exports.updateProjectorStatus = async (req, res) => {
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
        const projector = await Projector.findById(id);
        if (!projector) {
          return res.status(404).json({ message: "Không tìm thấy thiết bị" });
        }
    
        // Lưu lý do báo hỏng vào `reason`
        if (status === "Broken") {
          projector.brokenReason = brokenReason || "Không xác định";
        }
    
        projector.status = status;
        await projector.save();
    
        res.status(200).json(projector);
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error });
      }
  } catch (error) {
    console.error("Lỗi updateProjectorStatus:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
