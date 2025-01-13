const Inspect = require('../models/Inspect');


// Lấy danh sách tất cả các bản ghi kiểm tra
exports.getAllInspections = async (req, res) => {
  try {
    const { laptopId, inspectorId, startDate, endDate } = req.query;

    const filter = {};
    if (laptopId) filter.laptopId = laptopId;
    if (inspectorId) filter.inspectorId = inspectorId;
    if (startDate && endDate) {
      filter.inspectionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const inspections = await Inspect.find(filter).populate('laptopId inspectorId');
    res.status(200).json({ data: inspections });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inspections', error });
  }
};

// Lấy chi tiết một bản ghi kiểm tra
exports.getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = await Inspect.findById(id).populate('laptopId inspectorId');

    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    res.status(200).json({ data: inspection });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inspection', error });
  }
};

// Thêm bản ghi kiểm tra mới
exports.createInspection = async (req, res) => {
  console.log("Full Payload:", req.body);
  console.log("CPU Data from Payload:", req.body.cpu);
    try {
      const {
        laptopId,
        inspectorId,
        results, // Lấy toàn bộ `results` từ payload
        passed,
        recommendations,
      } = req.body;
      
      const cpu = results?.cpu; // Truy cập đúng vào `results.cpu`
      console.log("CPU Data:", cpu);
      
      // Kiểm tra CPU
      if (!cpu?.performance || !cpu?.temperature) {
        return res.status(400).json({ message: "Thông tin CPU không hợp lệ." });
      }

      // Kiểm tra các trường bắt buộc
      if (!laptopId || !inspectorId) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc." });
      }
      
    

    const newInspection = new Inspect({
      laptopId,
      inspectorId,
      inspectionDate: new Date(),
      results,
      passed: passed || false, // Mặc định là false
      recommendations: JSON.stringify(recommendations), // Chuyển thành chuỗi JSON
    });

    await newInspection.save();

    res.status(201).json({ message: "Inspection created successfully", data: newInspection });
  } catch (error) {
    console.error("Error creating inspection:", error);
    res.status(500).json({ message: "Error creating inspection", error });
  }
};

// Xóa một bản ghi kiểm tra
exports.deleteInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedInspection = await Inspect.findByIdAndDelete(id);

    if (!deletedInspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    res.status(200).json({ message: 'Inspection deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inspection', error });
  }
};

exports.updateInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    // Kiểm tra nếu `recommendations` không phải là string
    if (typeof updatedData.recommendations === "object") {
      updatedData.recommendations = JSON.stringify(updatedData.recommendations);
    }

    const updatedInspection = await Inspect.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedInspection) {
      return res.status(404).json({ message: "Inspection not found" });
    }

    res.status(200).json({ message: "Inspection updated successfully", data: updatedInspection });
  } catch (error) {
    console.error("Error updating inspection:", error);
    res.status(500).json({ message: "Error updating inspection", error });
  }
};


// Lấy lần kiểm tra mới nhất theo laptopId
exports.getLatestInspectionByLaptopId = async (req, res) => {
  try {
    const { laptopId } = req.params;
    const inspection = await Inspect.findOne({ laptopId })
    .sort({ inspectionDate: -1 }) // Lấy lần kiểm tra mới nhất
    .populate('inspectorId', 'fullname jobTitle email'); // Chỉ lấy các trường cần thiết
    if (!inspection) {
      return res.status(404).json({ message: 'Không tìm thấy dữ liệu kiểm tra' });
    }

    res.status(200).json({ 
      message: 'Dữ liệu kiểm tra', 
      data: {
        inspectionDate: inspection.inspectionDate,
        inspectorName: inspection.inspectorId?.fullname || 'Không xác định',
        results: inspection.results,
        overallCondition: inspection.results?.["Tổng thể"]?.overallCondition || 'Không xác định',
        documentUrl: inspection.report?.filePath || "#"      
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu kiểm tra:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};