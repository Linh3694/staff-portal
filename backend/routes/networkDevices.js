const express = require("express");
const router = express.Router();
const networkDevicesController = require("../controllers/networkDevicesController");

// Lấy danh sách tất cả thiết bị
router.get("/", networkDevicesController.getAllDevices);

// Thêm thiết bị mới
router.post("/", networkDevicesController.addDevice);

// Cập nhật trạng thái thiết bị theo địa chỉ IP
router.put("/status", networkDevicesController.updateDeviceStatus);

// Xóa thiết bị theo ID
router.delete("/:id", networkDevicesController.deleteDevice);

module.exports = router;