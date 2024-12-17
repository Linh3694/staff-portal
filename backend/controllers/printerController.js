const Printer = require("../models/Printer");
const User = require("../models/Users");
const mongoose = require("mongoose");
const Notification = require('../models/notification'); 

// Lấy danh sách Printer
exports.getPrinters = async (req, res) => {
  try {
    // Lấy danh sách Printer từ database
    const printers = await Printer.find()
    .lean(); // Sử dụng `.lean()` để trả về plain objects
    console.log(`Fetched ${printers.length} printers.`);

    // Lấy tất cả ID từ trường "assigned" trong các printer
    const allAssignedIds = printers
      .filter((printer) => Array.isArray(printer.assigned))
      .flatMap((printer) => printer.assigned);

    // Truy vấn thông tin tất cả người dùng liên quan
    const users = await User.find({ _id: { $in: allAssignedIds } }).lean();
    console.log(`Fetched ${users.length} users for assigned printers.`);

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

    // Gắn thông tin "assigned" vào từng printer
    const populatedPrinters = printers.map((printer) => ({
      ...printer,
      assigned: (printer.assigned || [])
        .map((userId) => usersById[userId] || null) // Nếu không tìm thấy user, trả về null
        .filter(Boolean), // Loại bỏ giá trị null
    }));

    // Trả về danh sách printer đã được populate
    res.status(200).json(populatedPrinters);
  } catch (error) {
    console.error("Error fetching Printers:", error.message);
    res.status(500).json({ message: "Error fetching Printers", error: error.message });
  }
};

// Thêm mới Printer
exports.createPrinter = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log dữ liệu nhận từ frontend

    const { name, manufacturer, serial, assigned, status, ip, type } = req.body;
    const userId = req.body.userId || req.headers['user-id'];

    if (!name || !manufacturer || !serial) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc!" });
    }

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const printer = new Printer({ name, manufacturer, serial, assigned, status, ip, type });
    await printer.save();

      
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
          const userFullname = user.fullname; // Lấy fullname của người dùng
          const notification = new Notification({
            message: `printer mới "${name}" đã được thêm bởi ${userFullname}.`,
            type: 'info',
          });
          await notification.save(); // Lưu thông báo vào database

    res.status(201).json(printer);
  } catch (error) {
    console.error("Error creating printer:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm printer", error: error.message });
  }
};

exports.updatePrinter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, manufacturer, serial, assigned, status, releaseYear, ip, type } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const printer = await Printer.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, ip, type  },
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
    res.status(400).json({ message: "Error deleting Printer", error });
  }
};

exports.bulkUploadPrinters = async (req, res) => {
  try {
    const { printers } = req.body;

    // Kiểm tra dữ liệu nhận được
    if (!printers || !Array.isArray(printers) || printers.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }

    const errors = []; // Danh sách lỗi
    const validPrinters = []; // Danh sách Printer hợp lệ

    // Xử lý từng Printer trong danh sách
    for (const printer of printers) {
      try {
        // Chuyển đổi `assigned` từ fullname sang ObjectId
        if (printer.assigned && Array.isArray(printer.assigned)) {
          const isObjectId = mongoose.Types.ObjectId.isValid(printer.assigned[0]);
          if (!isObjectId) {
            const assignedIds = await Promise.all(
              printer.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname }).select('_id');
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            printer.assigned = assignedIds;
          }
        }

        // Kiểm tra thông tin bắt buộc
        if (!printer.name || !printer.manufacturer || !printer.serial) {
          errors.push({
            serial: printer.serial || "Không xác định",
            message: "Thông tin printer không hợp lệ (thiếu tên, nhà sản xuất hoặc serial).",
          });
          continue; // Bỏ qua printer này
        }

        // Kiểm tra serial đã tồn tại
        const existingPrinter = await Printer.findOne({ serial: printer.serial });
        if (existingPrinter) {
          errors.push({
            serial: printer.serial,
            name: printer.name,
            message: `Serial ${printer.serial} đã tồn tại.`,
          });
          continue; // Bỏ qua printer này
        }

        // Nếu hợp lệ, thêm vào danh sách
        validPrinters.push(printer);
      } catch (error) {
        // Bắt lỗi trong quá trình xử lý từng printer
        errors.push({
          serial: printer.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý printer.",
        });
      }
    }

    // Nếu có lỗi, trả về danh sách lỗi
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Dữ liệu có lỗi",
        errors, // Danh sách lỗi
        addedPrinters: validPrinters.length, // Số lượng Printer hợp lệ
      });
    }

    // Thêm các Printer hợp lệ vào database
    if (validPrinters.length > 0) {
      await Printer.insertMany(validPrinters);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedPrinters: validPrinters.length, // Số lượng Printer được thêm thành công
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

    const printer = await Printer.findById(id);
    if (!printer) {
      return res.status(404).json({ message: "printer not found" });
    }

    printer.repairs.push(repairLog); // Thêm nhật ký sửa chữa
    await printer.save(); // Lưu thay đổi vào cơ sở dữ liệu

    res.status(201).json(repairLog); // Trả về nhật ký sửa chữa vừa được thêm
  } catch (error) {
    console.error("Error adding repair log:", error);
    res.status(500).json({ message: "Failed to add repair log" });
  }
};