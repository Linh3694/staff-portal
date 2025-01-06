const Printer = require("../models/Printer");
const User = require("../models/Users");
const Room = require("../models/Room")
const mongoose = require("mongoose");
const Notification = require('../models/notification'); 

// Lấy danh sách printer
exports.getPrinters = async (req, res) => {
  try {
    const printers = await Printer.find()
      .sort({ createdAt: -1 })  // sắp xếp giảm dần theo createdAt
      .populate("assigned", "fullname jobTitle department avatarUrl")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email title")
      .populate("assignmentHistory.revokedBy", "fullname email")
      .lean();

    // Nếu vẫn muốn reshape (thêm field `location` dạng string), bạn làm như cũ:
    const populatedPrinters = printers.map((printer) => ({
      ...printer,
      room: printer.room
        ? {
            ...printer.room,
            location:
              printer.room.location?.map(
                (loc) => `${loc.building}, tầng ${loc.floor}`
              ) || ["Không xác định"],
          }
        : { name: "Không xác định", location: ["Không xác định"] },
    }));

    // Trả về *toàn bộ* mà không kèm totalPages/currentPage
    return res.status(200).json({
      populatedPrinters,
    });
  } catch (error) {
    console.error("Error fetching printers:", error.message);
    return res.status(500).json({
      message: "Error fetching printers",
      error: error.message,
    });
  }
};

// Thêm mới printer
exports.createPrinter = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, manufacturer, serial, assigned, status, specs, type, room, reason } = req.body;
    const userId = req.body.userId || req.headers["user-id"];

    if (!name || !serial) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

    if (!specs || typeof specs !== "object") {
      return res.status(400).json({ message: "Thông tin specs không hợp lệ!" });
    }

     // Kiểm tra `serial` trùng lặp
     const existingPrinter = await Printer.findOne({ serial });
     if (existingPrinter) {
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


    const printer = new Printer({ name, manufacturer, serial, assigned, specs, status, type, room, reason: status === "Broken" ? reason : undefined, });
    
    await printer.save();

    // Tạo thông báo khi tạo mới printer
    const user = await User.findById(userId);
    if (user) {
      const notification = new Notification({
        message: `Printer mới "${name}" đã được thêm bởi ${user.fullname}.`,
        type: "info",
      });
      await notification.save();
    }
   
    res.status(201).json(printer);
  } catch (error) {
    console.error("Error creating printer:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm printer", error: error.message });
  }
};

exports.updatePrinter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, specs, type, room, reason } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    // Kiểm tra `room` nếu có
    if (room && !mongoose.Types.ObjectId.isValid(room)) {
      return res.status(400).json({ message: "Room ID không hợp lệ!" });
    }

    const printer = await Printer.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, specs, type, room, reason: status === "Broken" ? reason : undefined, },
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!printer) {
      return res.status(404).json({ message: "Không tìm thấy printer" });
    }

    res.json(printer);
  } catch (error) {
    console.error("Error updating printer:", error.message);
    res.status(400).json({ message: "Error updating printer", error: error.message });
  }
};

// Xóa printer
exports.deletePrinter = async (req, res) => {
  try {
    await Printer.findByIdAndDelete(req.params.id);
    res.json({ message: "Printer deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting printer", error });
  }
};

exports.bulkUploadPrinters = async (req, res) => {
  try {
    const { printers } = req.body;
    console.log("Printers:", printers);
    if (!printers || !Array.isArray(printers) || printers.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }
    

    const errors = [];
    const validPrinters = [];

    for (const printer of printers) {
      try {
        // Kiểm tra `room` và xử lý giá trị không hợp lệ
        // Thiết lập giá trị mặc định nếu thiếu
        printer.room = printer.room && mongoose.Types.ObjectId.isValid(printer.room) ? printer.room : null;
        printer.status = ["Active", "Standby", "Broken", "PendingDocumentation"].includes(printer.status)
          ? printer.status
          : "Standby";
        // Kiểm tra `status` và thiết lập giá trị mặc định
        if (!["Active", "Standby", "Broken", "PendingDocumentation"].includes(printer.status)) {
          console.warn(`Status không hợp lệ: ${printer.status}. Thiết lập giá trị 'Standby'.`);
          printer.status = "Standby"; // Gán giá trị mặc định
        }
        // Xử lý `assigned`
        if (printer.assigned && Array.isArray(printer.assigned)) {
          const isId = mongoose.Types.ObjectId.isValid(printer.assigned[0]);
          if (isId) {
            // Nếu là ID, kiểm tra sự tồn tại
            const validIds = await User.find({ _id: { $in: printer.assigned } }).select("_id");
            if (validIds.length !== printer.assigned.length) {
              throw new Error("Một số ID người dùng không tồn tại trong hệ thống.");
            }
          } else {
            // Nếu là fullname, ánh xạ sang ID
            const assignedIds = await Promise.all(
              printer.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname: fullname.trim() }).select("_id");
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            printer.assigned = assignedIds;
          }
        }

        // Kiểm tra room
        if (printer.room && !mongoose.Types.ObjectId.isValid(printer.room)) {
          throw new Error(`Room ID "${printer.room}" không hợp lệ.`);
        }

        // Kiểm tra thông tin printer
        if (!printer.name || !printer.serial) {
          errors.push({
            serial: printer.serial || "Không xác định",
            message: "Thông tin printer không hợp lệ (thiếu tên, serial).",
          });
          continue;
        }

        // Kiểm tra trùng lặp serial
        const existingPrinter = await Printer.findOne({ serial: printer.serial });
        if (existingPrinter) {
          errors.push({
            serial: printer.serial,
            name: printer.name,
            message: `Serial ${printer.serial} đã tồn tại.`,
          });
          continue;
        }

        validPrinters.push(printer);
      } catch (error) {
        errors.push({
          serial: printer.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý printer.",
        });
      }
    }

    if (validPrinters.length > 0) {
      await Printer.insertMany(validPrinters);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedPrinters: validPrinters.length,
      errors,
    });
  } catch (error) {
    console.error("Lỗi khi thêm mới hàng loạt:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm mới hàng loạt", error: error.message });
  }
};

// controllers/printerController.js
exports.assignPrinter = async (req, res) => {
  try {
    const { id } = req.params;         // printerId
    const { newUserId, notes } = req.body;

    const printer = await Printer.findById(id).populate("assigned");
    if (!printer) {
      return res.status(404).json({ message: "Không tìm thấy printer" });
    }
    // Đảm bảo tất cả các bản ghi trước đó có `endDate`
    printer.assignmentHistory.forEach((entry) => {
      if (!entry.endDate) {
        entry.endDate = new Date();
      }
    });
    // Lấy thông tin người thực hiện từ token
    const currentUser = req.user; // Nếu bạn có middleware xác thực
    console.log("Current User:", req.user);

    // Đóng lịch sử sử dụng trước đó (nếu có)
    if (printer.assigned?.length > 0) {
      const oldUserId = printer.assigned[0]._id;
      const lastHistory = printer.assignmentHistory.find(
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
    printer.assignmentHistory.push({
      user: newUser._id,
      userName: newUser.fullname,
      startDate: new Date(),
      notes: notes || "",
      assignedBy: currentUser.id,
      jobTitle: newUser.jobTitle || "Không xác định", // Thêm jobTitle
    });

    // Cập nhật currentHolder
    printer.currentHolder = {
      id: newUser._id,
      fullname: newUser.fullname,
      jobTitle: newUser.jobTitle,
      department: newUser.department,
      avatarUrl: newUser.avatarUrl,
    };

    // Cập nhật assigned
    printer.assigned = [newUser._id];
    printer.status = "PendingDocumentation"; // tuỳ logic
    await printer.save();

    // Populate thông tin người dùng
    const populatedPrinter = await printer.populate({
      path: "assignmentHistory.user",
      select: "fullname jobTitle avatarUrl",
    });
    
    res.status(200).json(
      populatedPrinter);
  } catch (error) {
    console.error("Lỗi assignPrinter:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// controllers/printerController.js
exports.revokePrinter = async (req, res) => {
  try {
    const { id } = req.params;
    const { revokedBy, reasons, status } = req.body;

    const printer = await Printer.findById(id).populate("assigned");
    if (!printer) {
      return res.status(404).json({ message: "Printer không tồn tại" });
    }

    const currentUser = req.user; // Người thực hiện thu hồi

    if (printer.assigned.length > 0) {
      const oldUserId = printer.assigned[0]._id;
      const lastHistory = printer.assignmentHistory.find(
        (hist) => hist.user?.toString() === oldUserId.toString() && !hist.endDate
      );
      if (lastHistory) {
        lastHistory.endDate = new Date();
        lastHistory.revokedBy = currentUser.id; // Ghi lại người thu hồi
        lastHistory.revokedReason = reasons; // Ghi lý do thu hồi vào bản ghi hiện tại
      }
    } else {
      // Nếu không có bản ghi nào đang mở, thêm một bản ghi mới
      printer.assignmentHistory.push({
        revokedBy,
        revokedReason: reasons,
        endDate: new Date(),
      });
    }

    // Cập nhật trạng thái thiết bị
    printer.status = status || "Standby"; // Hoặc trạng thái bạn mong muốn
    printer.currentHolder = null; // Xóa người đang giữ printer
    printer.assigned = [];
    await printer.save();

    res.status(200).json({ message: "Thu hồi thành công", printer });
  } catch (error) {
    console.error("Lỗi revokePrinter:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

exports.updatePrinterStatus = async (req, res) => {
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
        const printer = await Printer.findById(id);
        if (!printer) {
          return res.status(404).json({ message: "Không tìm thấy thiết bị" });
        }
    
        // Lưu lý do báo hỏng vào `reason`
        if (status === "Broken") {
          printer.brokenReason = brokenReason || "Không xác định";
        }
    
        printer.status = status;
        await printer.save();
    
        res.status(200).json(printer);
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error });
      }
  } catch (error) {
    console.error("Lỗi updatePrinterStatus:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};
