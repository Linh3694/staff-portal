const Activity = require('../models/Activity');

exports.getActivities = async (req, res) => {
  const { laptopId } = req.params;
  try {
    const activities = await Activity.find({ laptopId }).sort({ date: -1 });
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy lịch sử hoạt động', error });
  }
};

exports.addActivity = async (req, res) => {
  const { laptopId, type, description, details, date, updatedBy } = req.body;
  if (!laptopId) {
    return res.status(400).json({ message: 'LaptopId là bắt buộc' });
  }
  try {
    const newActivity = new Activity({
      laptopId,
      type,
      description,
      details,
      date: date || new Date(),
      updatedBy,
    });
    await newActivity.save();
    res.status(201).json(newActivity);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm hoạt động', error });
  }
};

exports.updateActivity = async (req, res) => {
  const { id } = req.params;
  const { description, details, date } = req.body;
  try {
    const updatedActivity = await Activity.findByIdAndUpdate(
      id,
      { description, details, date },
      { new: true }
    );
    res.status(200).json(updatedActivity);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật hoạt động', error });
  }
};

exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  try {
    await Activity.findByIdAndDelete(id);
    res.status(200).json({ message: 'Xóa hoạt động thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa hoạt động', error });
  }
};