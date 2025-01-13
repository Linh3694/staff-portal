const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photoController");
const upload = require("../middleware/uploadPhoto"); // Import cấu hình Multer mới
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", photoController.getPhotosByEvent);
router.post("/", upload.single("photo"), photoController.uploadPhoto); // Sử dụng Multer để xử lý upload ảnh
router.post("/:id/vote", authMiddleware, photoController.votePhoto);
router.delete("/:id", photoController.deletePhoto);
router.post("/:id/comment", authMiddleware, photoController.addComment);
router.get("/:id/comments", photoController.getComments);

module.exports = router;