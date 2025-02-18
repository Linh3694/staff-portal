const express = require('express');
const router = express.Router();
const validateToken = require('../middleware/validateToken');
const uploadPost = require('../middleware/uploadPost');
const newsfeedController = require('../controllers/newsfeedController');

// Tạo bài viết (kèm upload ảnh)
router.post(
  '/',
  validateToken,
  uploadPost.array('images'), // 'images' phải trùng với key FormData ở client
  newsfeedController.createPost
);

// Lấy danh sách bài viết
router.get('/', validateToken, newsfeedController.getPosts);

// Lấy chi tiết 1 bài viết
router.get('/:id', validateToken, newsfeedController.getPostById);

// Ghim bài viết
router.post('/:id/pin', validateToken, newsfeedController.pinPost);

// Reaction bài viết
router.post('/:id/react', validateToken, newsfeedController.reactToPost);

// Comment bài viết
router.post('/:id/comment', validateToken, newsfeedController.commentOnPost);

module.exports = router;