const Laptop = require("../models/Laptop");
const User = require("../models/Users");
const mongoose = require("mongoose");

// Lấy danh sách laptop
exports.getLaptops = async (req, res) => {
  try {
    // Lấy danh sách laptop từ database
    const laptops = await Laptop.find()
    .lean(); // Sử dụng `.lean()` để trả về plain objects
    console.log(`Fetched ${laptops.length} laptops.`);

    // Lấy tất cả ID từ trường "assigned" trong các laptop
    const allAssignedIds = laptops
      .filter((laptop) => Array.isArray(laptop.assigned))
      .flatMap((laptop) => laptop.assigned);

    // Truy vấn thông tin tất cả người dùng liên quan
    const users = await User.find({ _id: { $in: allAssignedIds } }).lean();
    console.log(`Fetched ${users.length} users for assigned laptops.`);

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

    // Gắn thông tin "assigned" vào từng laptop
    const populatedLaptops = laptops.map((laptop) => ({
      ...laptop,
      assigned: (laptop.assigned || [])
        .map((userId) => usersById[userId] || null) // Nếu không tìm thấy user, trả về null
        .filter(Boolean), // Loại bỏ giá trị null
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
    console.log("Request Body:", req.body); // Log dữ liệu nhận từ frontend

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

    const laptop = new Laptop({ name, manufacturer, serial, assigned, specs, status });
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
    const { name, manufacturer, serial, assigned, status, releaseYear, specs } = req.body;

    // Kiểm tra nếu `assigned` không phải là mảng hoặc có ID không hợp lệ
    if (assigned && !Array.isArray(assigned)) {
      return res.status(400).json({ message: "Assigned phải là mảng ID người sử dụng hợp lệ." });
    }

    const laptop = await Laptop.findByIdAndUpdate(
      id,
      { name, manufacturer, serial, assigned, status, releaseYear, specs  },
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

    // Kiểm tra dữ liệu nhận được
    if (!laptops || !Array.isArray(laptops) || laptops.length === 0) {
      return res.status(400).json({ message: "Không có dữ liệu hợp lệ để tải lên!" });
    }

    const errors = []; // Danh sách lỗi
    const validLaptops = []; // Danh sách laptop hợp lệ

    // Xử lý từng laptop trong danh sách
    for (const laptop of laptops) {
      try {
        // Chuyển đổi `assigned` từ fullname sang ObjectId
        if (laptop.assigned && Array.isArray(laptop.assigned)) {
          const isObjectId = mongoose.Types.ObjectId.isValid(laptop.assigned[0]);
          if (!isObjectId) {
            const assignedIds = await Promise.all(
              laptop.assigned.map(async (fullname) => {
                const user = await User.findOne({ fullname }).select('_id');
                if (!user) {
                  throw new Error(`Người dùng "${fullname}" không tồn tại trong hệ thống.`);
                }
                return user._id;
              })
            );
            laptop.assigned = assignedIds;
          }
        }

        // Kiểm tra thông tin bắt buộc
        if (!laptop.name || !laptop.manufacturer || !laptop.serial) {
          errors.push({
            serial: laptop.serial || "Không xác định",
            message: "Thông tin laptop không hợp lệ (thiếu tên, nhà sản xuất hoặc serial).",
          });
          continue; // Bỏ qua laptop này
        }

        // Kiểm tra serial đã tồn tại
        const existingLaptop = await Laptop.findOne({ serial: laptop.serial });
        if (existingLaptop) {
          errors.push({
            serial: laptop.serial,
            name: laptop.name,
            message: `Serial ${laptop.serial} đã tồn tại.`,
          });
          continue; // Bỏ qua laptop này
        }

        // Nếu hợp lệ, thêm vào danh sách
        validLaptops.push(laptop);
      } catch (error) {
        // Bắt lỗi trong quá trình xử lý từng laptop
        errors.push({
          serial: laptop.serial || "Không xác định",
          message: error.message || "Lỗi không xác định khi xử lý laptop.",
        });
      }
    }

    // Nếu có lỗi, trả về danh sách lỗi
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Dữ liệu có lỗi",
        errors, // Danh sách lỗi
        addedLaptops: validLaptops.length, // Số lượng laptop hợp lệ
      });
    }

    // Thêm các laptop hợp lệ vào database
    if (validLaptops.length > 0) {
      await Laptop.insertMany(validLaptops);
    }

    res.status(201).json({
      message: "Thêm mới hàng loạt thành công!",
      addedLaptops: validLaptops.length, // Số lượng laptop được thêm thành công
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
    const { description, date, updatedBy } = req.body; // Lấy thông tin từ request

    const repairLog = { description, date, updatedBy };

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