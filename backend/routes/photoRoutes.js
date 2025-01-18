const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photoController");
const uploadEvent = require("../middleware/uploadEvent"); // middleware cho upload file


// Lấy danh sách ảnh đã được phê duyệt
router.get("/", photoController.getPhotosByEvent);

// Lấy danh sách ảnh chưa được phê duyệt (admin only)
router.get("/pending", photoController.getPendingPhotos);

// Phê duyệt ảnh (admin only)
router.put("/:id/approve", photoController.approvePhoto);

// Tải lên ảnh mới
router.post("/", uploadEvent.single("file"), photoController.uploadPhoto);

// Xóa ảnh
router.delete("/:id", photoController.deletePhoto);

// Vote cho ảnh
router.post("/:id/vote", photoController.votePhoto);

// Thêm bình luận
router.post("/:id/comment", photoController.addComment);

// Lấy danh sách bình luận
router.get("/:id/comments", photoController.getComments);

// Lấy danh sách photo để làm leaderboard
router.get("/leaderboard", photoController.getLeaderboard);

router.get("/leaderboard-all", photoController.getLeaderboardAll);

// Lấy chi tiết ảnh theo ID
router.get("/:id", photoController.getPhotoById);



module.exports = router;