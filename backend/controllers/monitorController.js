const Monitor = require("../models/Monitor");
const User = require("../models/Users");
const Room = require("../models/Room")
const mongoose = require("mongoose");
const Notification = require('../models/notification'); 

// Lấy danh sách monitor
exports.getMonitors = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query; // Nhận tham số phân trang
    const skip = (page - 1) * limit;

    // Lấy tổng số record để tính tổng số trang
    const totalRecords = await Monitor.countDocuments();
    const totalPages = Math.ceil(totalRecords / limit);

    // Lấy danh sách monitor từ database
    const monitors = await Monitor.find()
    .skip(skip)
    .limit(Number(limit))
    .populate("assigned", "fullname jobTitle department avatarUrl") // Populate thông tin người dùng
    .populate("room", "name location status") // Populate thông tin phòng
    .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl") // Thêm jobTitle
    .populate("assignmentHistory.assignedBy", "fullname email title") // Populate thông tin assignedBy
    .populate("assignmentHistory.revokedBy", "fullname email") // Populate thông tin revokedBy
    .lean(); // Sử dụng `.lean()` để trả về plain objects
    console.log(monitors);

    // Gắn thông tin "assigned" vào từng monitor
    const populatedMonitors = monitors.map((monitor) => ({
      ...monitor,
      assigned: monitor.assigned || [], // Dữ liệu từ populate đã có
      room: monitor.room
  ? {
      ...monitor.room,
      location: monitor.room.location?.map(
        (loc) => `${loc.building}, tầng ${loc.floor}`
      ) || ["Không xác định"],
    }
  : { name: "Không xác định", location: ["Không xác định"] }, // Gắn giá trị mặc định nếu room null
    }));

    // Trả về danh sách monitor đã được populate
    res.status(200).json({
      populatedMonitors,
      totalPages,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching monitors:", error.message);
    res.status(500).json({ message: "Error fetching monitors", error: error.message });
  }
};

// Thêm mới monitor
exports.createMonitor = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, manufacturer, serial, assigned, status, room, reason } = req.body;
    const userId = req.body.userId || req.headers["user-id"];

    if (!name || !serial) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

     // Kiểm tra `serial` trùng lặp
     const existingMonitor = await Monitor.findOne({ serial });
     if (existingMonitor) {
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


    const monitor = new Monitor({ name, manufacturer, serial, assigned, status, room, reason: status === "Broken" ? reason : undefined, });
    
    await monitor.save();

    // Tạo thông báo khi tạo mới monitor
    const user = await User.findById(userId);
    if (user) {
      const notification = new Notification({
        message: `Monitor mới "${name}" đã được thêm bởi ${user.fullname}.`,
        type: "info",
      });
      await notification.save();
    }
   
    res.status(201).json(monitor);
  } catch (error) {
    console.error("Error creating monitor:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm monitor", error: error.message });
  }
};

exports.updateMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, room, reason } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    // Kiểm tra `room` nếu có
    if (room && !mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ message: "Room ID không hợp lệ!" });
    }

    const monitor = await Monitor.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear,room, reason: status === "Broken" ? reason : undefined, },
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!monitor) {
      return res.status(404).json({ message: "Không tìm thấy monitor" });
    }

    res.json(monitor);
  } catch (error) {
    console.error("Error updating monitor:", error.message);
    res.status(400).json({ message: "Error updating monitor", error: error.message });
  }
};

// Xóa monitor
exports.deleteMonitor = async (req, res) => {
  try {
    await Monitor.findByIdAndDelete(req.params.id);
    res.json({ message: "Monitor deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting monitor", error });
  }
};

exports.bulkUploadMonitors = async (req, res) => {
  try {
    const { monitors } = req.body;
    console.log("Monitors:", monitors);
    if (!monitors || !Array.isArray(monitors) || monitors.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }
    

    const errors = [];
    const validMonitors = [];

    for (const monitor of monitors) {
      try {
        // Kiểm tra `room` và xử lý giá trị không hợp lệ
        // Thiết lập giá trị mặc định nếu thiếu
        monitor.room = monitor.room && mongoose.Types.ObjectId.isValid(monitor.room) ? monitor.room : null;
        monitor.status = ["Active", "Standby", "Broken", "PendingDocumentation"].includes(monitor.status)
          ? monitor.status
          : "Standby";
        // Kiểm tra `status` và thiết lập giá trị mặc định
        if (!["Active", "Standby", "Broken", "PendingDocumentation"].includes(monitor.status)) {
          console.warn(`Status không hợp lệ: ${monitor.status}. Thiết lập giá trị 'Standby'.`);
          monitor.status = "Standby"; // Gán giá trị mặc định
        }
        // Xử lý `assigned`
        if (monitor.assigned && Array.isArray(monitor.assigned)) {
          const isId = mongoose.Types.ObjectId.isValid(monitor.assigned[0]);
          if (isId) {
            // Nếu là ID, kiểm tra sự tồn tại
            const validIds = await User.find({ _id: { $in: monitor.assigned } }).select("_id");
            if (validIds.length !== monitor.assigned.length) {
              throw new Error("Một số ID người dùng không tồn tại trong hệ thống.");
            }
          } else {
            // Nếu là fullname, ánh xạ sang ID
            const assignedIds = await Promise.all(
              monitor.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname: fullname.trim() }).select("_id");
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            monitor.assigned = assignedIds;
          }
        }

        // Kiểm tra room
        if (monitor.room && !mongoose.Types.ObjectId.isValid(monitor.room)) {
          throw new Error(`Room ID "${monitor.room}" không hợp lệ.`);
        }

        // Kiểm tra thông tin monitor
        if (!monitor.name || !monitor.serial) {
          errors.push({
            serial: monitor.serial || "Không xác định",
            message: "Thông tin monitor không hợp lệ (thiếu tên, serial).",
          });
          continue;
        }

        // Kiểm tra trùng lặp serial
        const existingMonitor = await Monitor.findOne({ serial: monitor.serial });
        if (existingMonitor) {
          errors.push({
            serial: monitor.serial,
            name: monitor.name,
            message: `Serial ${monitor.serial} đã tồn tại.`,
          });
          continue;
        }

        validMonitors.push(monitor);
      } catch (error) {
        errors.push({
          serial: monitor.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý monitor.",
        });
      }
    }

    if (validMonitors.length > 0) {
      await Monitor.insertMany(validMonitors);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedMonitors: validMonitors.length,
      errors,
    });
  } catch (error) {
    console.error("Lỗi khi thêm mới hàng loạt:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm mới hàng loạt", error: error.message });
  }
};

// controllers/monitorController.js
exports.assignMonitor = async (req, res) => {
  try {
    const { id } = req.params;         // monitorId
    const { newUserId, notes } = req.body;

    const monitor = await Monitor.findById(id).populate("assigned");
    if (!monitor) {
      return res.status(404).json({ message: "Không tìm thấy monitor" });
    }
    // Đảm bảo tất cả các bản ghi trước đó có `endDate`
    monitor.assignmentHistory.forEach((entry) => {
      if (!entry.endDate) {
        entry.endDate = new Date();
      }
    });
    // Lấy thông tin người thực hiện từ token
    const currentUser = req.user; // Nếu bạn có middleware xác thực
    console.log("Current User:", req.user);

    // Đóng lịch sử sử dụng trước đó (nếu có)
    if (monitor.assigned?.length > 0) {
      const oldUserId = monitor.assigned[0]._id;
      const lastHistory = monitor.assignmentHistory.find(
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
    monitor.assignmentHistory.push({
      user: newUser._id,
      userName: newUser.fullname,
      startDate: new Date(),
      notes: notes || "",
      assignedBy: currentUser.id,
      jobTitle: newUser.jobTitle || "Không xác định", // Thêm jobTitle
    });

    // Cập nhật currentHolder
    monitor.currentHolder = {
      id: newUser._id,
      fullname: newUser.fullname,
      jobTitle: newUser.jobTitle,
      department: newUser.department,
      avatarUrl: newUser.avatarUrl,
    };

    // Cập nhật assigned
    monitor.assigned = [newUser._id];
    monitor.status = "PendingDocumentation"; // tuỳ logic
    await monitor.save();

    // Populate thông tin người dùng
    const populatedMonitor = await monitor.populate({
      path: "assignmentHistory.user",
      select: "fullname jobTitle avatarUrl",
    });
    
    res.status(200).json(
      populatedMonitor);
  } catch (error) {
    console.error("Lỗi assignMonitor:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// controllers/monitorController.js
exports.revokeMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { revokedBy, reasons, status } = req.body;

    const monitor = await Monitor.findById(id).populate("assigned");
    if (!monitor) {
      return res.status(404).json({ message: "Monitor không tồn tại" });
    }

    const currentUser = req.user; // Người thực hiện thu hồi

    if (monitor.assigned.length > 0) {
      const oldUserId = monitor.assigned[0]._id;
      const lastHistory = monitor.assignmentHistory.find(
        (hist) => hist.user?.toString() === oldUserId.toString() && !hist.endDate
      );
      if (lastHistory) {
        lastHistory.endDate = new Date();
        lastHistory.revokedBy = currentUser.id; // Ghi lại người thu hồi
        lastHistory.revokedReason = reasons; // Ghi lý do thu hồi vào bản ghi hiện tại
      }
    } else {
      // Nếu không có bản ghi nào đang mở, thêm một bản ghi mới
      monitor.assignmentHistory.push({
        revokedBy,
        revokedReason: reasons,
        endDate: new Date(),
      });
    }

    // Cập nhật trạng thái thiết bị
    monitor.status = status || "Standby"; // Hoặc trạng thái bạn mong muốn
    monitor.currentHolder = null; // Xóa người đang giữ monitor
    monitor.assigned = [];
    await monitor.save();

    res.status(200).json({ message: "Thu hồi thành công", monitor });
  } catch (error) {
    console.error("Lỗi revokeMonitor:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

exports.updateMonitorStatus = async (req, res) => {
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
        const monitor = await Monitor.findById(id);
        if (!monitor) {
          return res.status(404).json({ message: "Không tìm thấy thiết bị" });
        }
    
        // Lưu lý do báo hỏng vào `reason`
        if (status === "Broken") {
          monitor.brokenReason = brokenReason || "Không xác định";
        }
    
        monitor.status = status;
        await monitor.save();
    
        res.status(200).json(monitor);
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error });
      }
  } catch (error) {
    console.error("Lỗi updateMonitorStatus:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
