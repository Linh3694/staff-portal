const mongoose = require('mongoose');
const Post = require('../models/Post');

/**
 * Tạo bài viết mới, kèm upload ảnh
 * - Ảnh được upload qua middleware, truy cập `req.files`
 */
exports.createPost = async (req, res) => {
  try {
    const authorId = req.user._id; // ID user sau khi xác thực
    const {
      content,
      type,
      visibility,
      department,
      tags,
      badgeInfo,
    } = req.body;

    // Lấy danh sách file ảnh sau upload
    // Mỗi phần tử chứa đường dẫn file gốc: file.path
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        uploadedImages.push(file.path);
      });
    }

    // Nếu visibility = 'department' thì kiểm tra department ID
    let dept = null;
    if (visibility === 'department' && department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: 'Department ID không hợp lệ' });
      }
      dept = department;
    }

    const newPost = new Post({
      author: authorId,
      content: content || '',
      images: uploadedImages,
      videos: [], // Tùy dự án, có thể thêm logic upload videos
      type: type || 'Chia sẻ',
      visibility: visibility || 'public',
      department: dept,
      tags: tags || [],
      badgeInfo: badgeInfo || null,
    });

    const savedPost = await newPost.save();
    return res.status(201).json({ message: 'Tạo bài viết thành công', post: savedPost });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * Lấy danh sách bài viết
 */
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('author', 'name email') // Tùy thuộc model User
      .sort({ createdAt: -1 });
    return res.json({ posts });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * Lấy chi tiết 1 bài viết
 */
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate('author', 'name email');
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }
    return res.json({ post });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * Ghim bài viết
 */
exports.pinPost = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Post.findByIdAndUpdate(
      id,
      { isPinned: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }
    return res.json({ message: 'Đã ghim bài viết', post: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * Reaction (like, love, etc.) cho bài viết
 */
exports.reactToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType } = req.body; // ví dụ: 'like', 'love'
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    const existingReaction = post.reactions.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (existingReaction) {
      existingReaction.type = reactionType;
    } else {
      post.reactions.push({ user: userId, type: reactionType });
    }

    await post.save();
    return res.json({ message: 'Reaction cập nhật thành công', post });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

/**
 * Bình luận lên bài viết
 */
exports.commentOnPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Bài viết không tồn tại' });
    }

    const newComment = {
      user: userId,
      content,
    };
    post.comments.push(newComment);
    await post.save();

    return res.json({ message: 'Đã thêm bình luận', post });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};