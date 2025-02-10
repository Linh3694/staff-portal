// backend/routes/newsfeed.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Post = require('../models/Post');
const Notification = require('../models/notification');
const validateToken = require('../middleware/validateToken'); 
// Hoặc import middleware tuỳ vào dự án

// 1. Tạo bài viết mới
router.post('/', validateToken, async (req, res) => {
  try {
    const {
      content,
      images,
      videos,
      type,
      visibility,
      department,
      tags,
      badgeInfo,
    } = req.body;

    // author lấy từ token (req.user._id) hoặc tuỳ logic
    const authorId = req.user._id;

    // Nếu visibility = department thì cần department id
    let dept = null;
    if (visibility === 'department' && department) {
      // Kiểm tra department ID có hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ message: 'Department ID không hợp lệ.' });
      }
      dept = department;
    }

    // Tạo post
    const newPost = new Post({
      author: authorId,
      content,
      images: images || [],
      videos: videos || [],
      type: type || 'Chia sẻ',
      visibility: visibility || 'public',
      department: dept,
      tags: tags || [],
      badgeInfo: badgeInfo || null,
    });

    const savedPost = await newPost.save();

    // Tạo notification nếu có tag user
    if (tags && tags.length > 0) {
      // Tạo nhiều notification cho mỗi user được tag
      tags.forEach(async (taggedUserId) => {
        await Notification.create({
          user: taggedUserId,
          message: `Bạn đã được tag trong một bài viết.`,
          isRead: false,
          // ... các thuộc tính khác (reference post, etc.)
        });
      });
    }

    // (Option) Nếu type = 'Badge' => Gửi noti đặc biệt
    if (type === 'Badge' && badgeInfo) {
      // Logic tuỳ ý, ví dụ: gửi noti cho người nhận huy hiệu
      // (nếu trong badgeInfo có userRecipient hay tương tự)
    }

    res.status(201).json({
      message: 'Đăng bài thành công',
      post: savedPost,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// 2. Lấy danh sách bài viết + filter + search
router.get('/', validateToken, async (req, res) => {
  try {
    // Query params: ?department=...&type=...&search=...
    const { department, type, search } = req.query;
    const filter = {};

    if (department) {
      filter.department = department;
      filter.visibility = 'department';
    }

    if (type) {
      filter.type = type; // "Thông báo", "Chia sẻ", ...
    }

    if (search) {
      // Tìm content chứa từ khoá, regex ko dấu tuỳ ý
      filter.content = { $regex: search, $options: 'i' };
    }

    // Logic hiển thị bài viết:
    // - Nếu post visibility = 'public' => ai cũng thấy
    // - Nếu post visibility = 'department' => chỉ cùng dept
    //   => tuỳ logic, ví dụ: user đăng nhập có department = ...
    //   => cẩn kiểm tra user thuộc dept hay ko

    // Demo: Lấy hết post 'public' + post 'department' (nếu user cùng dept)
    // Giả sử userDept = req.user.department
    // Ta custom logic: 
    const userDept = req.user.department;
    const visibleFilter = {
      $or: [
        { visibility: 'public' },
        { visibility: 'department', department: userDept },
      ],
    };

    // Gộp filter
    const finalFilter = { ...filter, ...visibleFilter };

    const posts = await Post.find(finalFilter)
      .populate('author', 'name email')      // Lấy thông tin tác giả
      .populate('tags', 'name email')        // Lấy thông tin người được tag
      .populate('department', 'name')        // Lấy tên phòng ban
      .sort({ createdAt: -1 });              // Mới nhất trước

    res.status(200).json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// 3. Lấy chi tiết 1 bài
router.get('/:id', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Post ID không hợp lệ.' });
    }

    const post = await Post.findById(id)
      .populate('author', 'name email')
      .populate('tags', 'name email')
      .populate('department', 'name')
      .populate('comments.user', 'name email')
      .populate('comments.reactions.user', 'name email')
      .populate('reactions.user', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Post không tồn tại.' });
    }

    // Kiểm tra quyền xem (nếu visibility=department => kiểm tra user dept)
    // Tuỳ logic

    res.status(200).json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// 4. Thả reaction vào bài viết
router.post('/:id/react', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType } = req.body; // "like", "love", "haha", "sad", ...
    const userId = req.user._id; 

    if (!['like', 'love', 'haha', 'sad', 'wow'].includes(reactionType)) {
      return res.status(400).json({ message: 'Loại reaction không hợp lệ.' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post không tồn tại.' });
    }

    // Xoá reaction cũ cùng userId (nếu muốn user chỉ được 1 reaction)
    post.reactions = post.reactions.filter(
      (r) => r.user.toString() !== userId.toString()
    );

    // Push reaction mới
    post.reactions.push({
      user: userId,
      type: reactionType,
    });

    await post.save();

    // Tạo notification cho tác giả post
    if (post.author.toString() !== userId.toString()) {
      await Notification.create({
        user: post.author,
        message: `Bài viết của bạn có 1 reaction mới.`,
        isRead: false,
        // ...
      });
    }

    res.status(200).json({ message: 'Reaction thành công', post });
  } catch (error) {
    console.error('Error reacting to post:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// 5. Bình luận vào bài viết
router.post('/:id/comment', validateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post không tồn tại.' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Nội dung comment không được trống.' });
    }

    post.comments.push({
      user: userId,
      content: content,
    });

    await post.save();

    // Tạo notification cho tác giả post
    if (post.author.toString() !== userId.toString()) {
      await Notification.create({
        user: post.author,
        message: `Bài viết của bạn có bình luận mới.`,
        isRead: false,
      });
    }

    // Tạo notification cho những user được tag (nếu muốn) ...
    // Tạo notification cho những user đã từng comment (tính năng subscription)...

    res.status(201).json({ message: 'Bình luận thành công', post });
  } catch (error) {
    console.error('Error commenting on post:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;