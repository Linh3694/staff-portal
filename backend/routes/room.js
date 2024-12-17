const express = require("express");
const router = express.Router();
const {
  getAllRooms,
  addRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");

// Lấy tất cả phòng
router.get("/", getAllRooms);

// Thêm phòng mới
router.post("/", addRoom);

// Cập nhật phòng
router.put("/:id", updateRoom);

// Xóa phòng
router.delete("/:id", deleteRoom);

module.exports = router;