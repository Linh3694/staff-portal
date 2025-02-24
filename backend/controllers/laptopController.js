const Laptop = require("../models/Laptop");
const path = require("path");
const fs = require("fs");
const User = require("../models/Users");
const Room = require("../models/Room")
const mongoose = require("mongoose");
const upload = require("../middleware/uploadHandover"); // Middleware Multer


// Lấy danh sách laptop
exports.getLaptops = async (req, res) => {
  try {
    const laptops = await Laptop.find()
      .sort({ createdAt: -1 })  // sắp xếp giảm dần theo createdAt
      .populate("assigned", "fullname jobTitle department avatarUrl")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email title")
      .populate("assignmentHistory.revokedBy", "fullname email")
      .lean();

    // Nếu vẫn muốn reshape (thêm field `location` dạng string), bạn làm như cũ:
    const populatedLaptops = laptops.map((laptop) => ({
      ...laptop,
      room: laptop.room
        ? {
            ...laptop.room,
            location:
              laptop.room.location?.map(
                (loc) => `${loc.building}, tầng ${loc.floor}`
              ) || ["Không xác định"],
          }
        : { name: "Không xác định", location: ["Không xác định"] },
    }));

    // Trả về *toàn bộ* mà không kèm totalPages/currentPage
    return res.status(200).json({
      populatedLaptops,
    });
  } catch (error) {
    console.error("Error fetching laptops:", error.message);
    return res.status(500).json({
      message: "Error fetching laptops",
      error: error.message,
    });
  }
};

// Thêm mới laptop
exports.createLaptop = async (req, res) => {
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
    const existingLaptop = await Laptop.findOne({ serial });
    if (existingLaptop) {
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


    const laptop = new Laptop({ name, manufacturer, serial, assigned, specs, status, type, room, reason: status === "Broken" ? reason : undefined, });
    
    await laptop.save();
   
    res.status(201).json(laptop);
  } catch (error) {
    console.error("Error creating laptop:", error.message);
    res.status(500).json({ message: "Lỗi khi thêm laptop", error: error.message });
  }
};

exports.updateLaptop = async (req, res) => {
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

    const laptop = await Laptop.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, specs, type, room, reason: status === "Broken" ? reason : undefined, },
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
    console.log("Laptops:", laptops);
    if (!laptops || !Array.isArray(laptops) || laptops.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }
    const errors = [];
    const validLaptops = [];

    for (const laptop of laptops) {
      try {
        // Kiểm tra `room` và xử lý giá trị không hợp lệ
        // Thiết lập giá trị mặc định nếu thiếu
        laptop.room = laptop.room && mongoose.Types.ObjectId.isValid(laptop.room) ? laptop.room : null;
        laptop.status = ["Active", "Standby", "Broken", "PendingDocumentation"].includes(laptop.status)
          ? laptop.status
          : "Standby";
        // Kiểm tra `status` và thiết lập giá trị mặc định
        if (!["Active", "Standby", "Broken", "PendingDocumentation"].includes(laptop.status)) {
          console.warn(`Status không hợp lệ: ${laptop.status}. Thiết lập giá trị 'Standby'.`);
          laptop.status = "Standby"; // Gán giá trị mặc định
        }
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
        if (!laptop.name || !laptop.serial) {
          errors.push({
            serial: laptop.serial || "Không xác định",
            message: "Thông tin laptop không hợp lệ (thiếu tên, serial).",
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

// controllers/laptopController.js
exports.assignLaptop = async (req, res) => {
  try {
    const { id } = req.params;         // laptopId
    const { newUserId, notes } = req.body;

    const laptop = await Laptop.findById(id).populate("assigned");
    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy laptop" });
    }
    // Đảm bảo tất cả các bản ghi trước đó có `endDate`
    laptop.assignmentHistory.forEach((entry) => {
      if (!entry.endDate) {
        entry.endDate = new Date();
      }
    });
    // Lấy thông tin người thực hiện từ token
    const currentUser = req.user; // Nếu bạn có middleware xác thực
    console.log("Current User:", req.user);

    // Đóng lịch sử sử dụng trước đó (nếu có)
    if (laptop.assigned?.length > 0) {
      const oldUserId = laptop.assigned[0]._id;
      const lastHistory = laptop.assignmentHistory.find(
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
    laptop.assignmentHistory.push({
      user: newUser._id,
      userName: newUser.fullname,
      startDate: new Date(),
      notes: notes || "",
      assignedBy: currentUser.id,
      jobTitle: newUser.jobTitle || "Không xác định", // Thêm jobTitle
    });

    // Cập nhật currentHolder
    laptop.currentHolder = {
      id: newUser._id,
      fullname: newUser.fullname,
      jobTitle: newUser.jobTitle,
      department: newUser.department,
      avatarUrl: newUser.avatarUrl,
    };

    // Cập nhật assigned
    laptop.assigned = [newUser._id];
    laptop.status = "PendingDocumentation"; // tuỳ logic
    await laptop.save();

    // Populate thông tin người dùng
    const populatedLaptop = await laptop.populate({
      path: "assignmentHistory.user",
      select: "fullname jobTitle avatarUrl department",
    });
    
    res.status(200).json(
      populatedLaptop);
  } catch (error) {
    console.error("Lỗi assignLaptop:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// controllers/laptopController.js
exports.revokeLaptop = async (req, res) => {
  try {
    const { id } = req.params;
    const { revokedBy, reasons, status } = req.body;

    const laptop = await Laptop.findById(id).populate("assigned");
    if (!laptop) {
      return res.status(404).json({ message: "Laptop không tồn tại" });
    }

    const currentUser = req.user; // Người thực hiện thu hồi

    if (laptop.assigned.length > 0) {
      const oldUserId = laptop.assigned[0]._id;
      const lastHistory = laptop.assignmentHistory.find(
        (hist) => hist.user?.toString() === oldUserId.toString() && !hist.endDate
      );
      if (lastHistory) {
        lastHistory.endDate = new Date();
        lastHistory.revokedBy = currentUser.id; // Ghi lại người thu hồi
        lastHistory.revokedReason = reasons; // Ghi lý do thu hồi vào bản ghi hiện tại
      }
    } else {
      // Nếu không có bản ghi nào đang mở, thêm một bản ghi mới
      laptop.assignmentHistory.push({
        revokedBy,
        revokedReason: reasons,
        endDate: new Date(),
      });
    }

    // Cập nhật trạng thái thiết bị
    laptop.status = status || "Standby"; // Hoặc trạng thái bạn mong muốn
    laptop.currentHolder = null; // Xóa người đang giữ laptop
    laptop.assigned = [];
    await laptop.save();

    res.status(200).json({ message: "Thu hồi thành công", laptop });
  } catch (error) {
    console.error("Lỗi revokeLaptop:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

exports.updateLaptopStatus = async (req, res) => {
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
        const laptop = await Laptop.findById(id);
        if (!laptop) {
          return res.status(404).json({ message: "Không tìm thấy thiết bị" });
        }
    
        // Lưu lý do báo hỏng vào `reason`
        if (status === "Broken") {
          laptop.brokenReason = brokenReason || "Không xác định";
        }
    
        laptop.status = status;
        await laptop.save();
    
        res.status(200).json(laptop);
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error });
      }
  } catch (error) {
    console.error("Lỗi updateLaptopStatus:", error);
    res.status(500).json({ message: "Lỗi server", error });
  }
};

exports.searchLaptops = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Từ khóa tìm kiếm không hợp lệ!" });
    }

    // Tìm kiếm theo Tên thiết bị, Serial và Người sử dụng
    const searchQuery = {
      $or: [
        { name: { $regex: query, $options: "i" } }, // Tìm theo tên thiết bị
        { serial: { $regex: query, $options: "i" } }, // Tìm theo serial
        {
          "assigned.fullname": { $regex: query, $options: "i" }, // Tìm theo tên người sử dụng
        },
      ],
    };

    const laptops = await Laptop.find(searchQuery)
      .populate("assigned", "fullname jobTitle department avatarUrl")
      .populate("room", "name location status")
      .lean(); // Trả về object thường

    res.status(200).json(laptops);
  } catch (error) {
    console.error("Error during search:", error.message);
    res.status(500).json({ message: "Lỗi khi tìm kiếm laptops", error: error.message });
  }
};

exports.uploadHandoverReport = async (req, res) => {
  console.log("📤 Dữ liệu nhận được từ frontend:", req.body);
  try {
    const { laptopId, userId, username } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File không được tải lên." });
    }

    console.log("✅ Trong Controller - username nhận được:", username);

    const filePath = req.file.path;
    console.log("✅ Đường dẫn file đã lưu:", filePath);

    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị." });
    }

    console.log("✅ Tìm thấy laptop:", laptop);

    let currentAssignment = laptop.assignmentHistory.find(
      (history) => 
        history.user && 
        history.user.toString() === userId && 
        !history.endDate
    );

    if (!currentAssignment) {
      console.warn("⚠️ Không tìm thấy lịch sử bàn giao hợp lệ. Tạo bản ghi mới...");
      laptop.assignmentHistory.push({
        user: new mongoose.Types.ObjectId(userId),
        startDate: new Date(),
        document: filePath,
      });

      currentAssignment = laptop.assignmentHistory[laptop.assignmentHistory.length - 1];
    } else {
      console.log("🔄 Cập nhật lịch sử bàn giao hiện tại.");
      currentAssignment.document = filePath;
    }

    laptop.status = "Active";
    await laptop.save();

    return res.status(200).json({
      message: "Tải lên biên bản thành công!",
      laptop,
    });
  } catch (error) {
    console.error("❌ Lỗi khi tải lên biên bản:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi server." });
  }
};

// Endpoint để trả file PDF
exports.getHandoverReport = async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads/Handovers", filename);

  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Không tìm thấy file." });
  }

  // Gửi file PDF
  res.sendFile(filePath);
};

// Lấy thông tin chi tiết laptop
exports.getLaptopById = async (req, res) => {
  const { id } = req.params;

  try {
    const laptop = await Laptop.findById(id)
      .populate("assigned", "fullname email jobTitle avatarUrl department")
      .populate("room", "name location status")
      .populate("assignmentHistory.user", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.assignedBy", "fullname email jobTitle avatarUrl")
      .populate("assignmentHistory.revokedBy", "fullname email jobTitle avatarUrl");

    if (!laptop) {
      return res.status(404).json({ message: "Không tìm thấy laptop" });
    }

    res.status(200).json(laptop);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin laptop:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
};

// Cập nhật thông tin specs của laptop
exports.updateLaptopSpecs = async (req, res) => {
  try {
    console.log("Payload nhận được từ frontend:", req.body);

    const { id } = req.params;
    const { specs = {}, releaseYear, manufacturer, type } = req.body;

    // Lấy laptop hiện tại từ DB
    const currentLaptop = await Laptop.findById(id);
    if (!currentLaptop) {
      return res.status(404).json({ message: "Laptop không tồn tại." });
    }

    // Làm sạch dữ liệu specs
    const cleanedSpecs = {
      processor: specs.processor ?? currentLaptop.specs.processor,
      ram: specs.ram ?? currentLaptop.specs.ram,
      storage: specs.storage ?? currentLaptop.specs.storage,
      display: specs.display ?? currentLaptop.specs.display,
    };

    // Cập nhật payload
    const updates = {
      specs: cleanedSpecs,
      releaseYear: releaseYear ?? currentLaptop.releaseYear,
      manufacturer: manufacturer ?? currentLaptop.manufacturer,
      type: type ?? currentLaptop.type,
    };

    console.log("Payload để cập nhật (sau khi làm sạch):", updates);

    const updatedLaptop = await Laptop.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedLaptop) {
      return res.status(404).json({ message: "Không thể cập nhật laptop." });
    }

    console.log("Laptop sau khi cập nhật:", updatedLaptop);
    res.status(200).json(updatedLaptop);
  } catch (error) {
    console.error("Lỗi khi cập nhật specs:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};