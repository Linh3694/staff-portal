const express = require('express');
const Notification = require('../models/notification'); // Đảm bảo đúng đường dẫn
const router = express.Router();

// Lấy danh sách thông báo
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

router.get('/unread', async (req, res) => {
  try {
    const notifications = await Notification.find({ isRead: false });
    res.json({ notifications, count: notifications.length });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// API đánh dấu tất cả thông báo chưa đọc là đã đọc
router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;