const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photoController");
const uploadEvent = require("../middleware/uploadEvent"); // middleware cho upload file


// Lấy danh sách ảnh đã được phê duyệt
router.get("/", photoController.getPhotosByEvent);
router.get("/count", photoController.getPhotoCounts);

// Lấy danh sách ảnh chưa được phê duyệt (admin only)
router.get("/pending", photoController.getPendingPhotos);
router.get("/approved", photoController.getApprovedPhotos);
router.get("/denied", photoController.getDeniedPhotos);

// Phê duyệt ảnh (admin only)
router.put("/:id/approve", photoController.approvePhoto);
router.put("/:id/reject", photoController.rejectPhoto); // ✅ API từ chối ảnh

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