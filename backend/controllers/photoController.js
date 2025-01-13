const Photo = require("../models/Photos");
const Event = require("../models/Events");

// Lấy danh sách ảnh theo ID sự kiện
exports.getPhotosByEvent = async (req, res) => {
  const { eventId } = req.query;
  try {
    const photos = await Photo.find({ eventId });
    res.status(200).json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ảnh!" });
  }
};

// Thêm ảnh mới
exports.uploadPhoto = async (req, res) => {
  console.log(req.body);
  console.log(req.file);

  const { eventId, message, uploaderName } = req.body;
  const url = `/uploads/Events/${req.file?.filename}`; // Đường dẫn file

  try {
    const event = await Event.findById(eventId); // Kiểm tra sự kiện có tồn tại không
    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện!" });
    }

    // Tạo ảnh mới
    const newPhoto = new Photo({ eventId, url, message, uploaderName });
    await newPhoto.save();
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).json({ message: "Lỗi khi tải ảnh lên!" });
  }
};

// Vote cho ảnh
exports.votePhoto = async (req, res) => {
  const { id } = req.params; // ID của ảnh
  try {
    // Tìm ảnh và tăng số lượng vote
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: "Không tìm thấy ảnh!" });
    }

    photo.votes += 1; // Tăng số lượng vote
    await photo.save(); // Lưu thay đổi

    return res.status(200).json({ message: "Đã vote ảnh thành công!", photo });
  } catch (error) {
    console.error("Error voting photo:", error);
    return res.status(500).json({ message: "Lỗi khi vote ảnh!" });
  }
};

// Thêm bình luận vào ảnh
exports.addComment = async (req, res) => {
  const { id } = req.params; // ID của ảnh
  const { text, user } = req.body; // Nội dung bình luận và tên người dùng

  if (!text || !user) {
    return res.status(400).json({ message: "Vui lòng nhập nội dung và tên người bình luận!" });
  }

  try {
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: "Không tìm thấy ảnh!" });
    }

    // Thêm bình luận
    photo.comments.push({ text, user });
    await photo.save();
    res.status(200).json(photo.comments); // Trả về danh sách bình luận mới
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Lỗi khi thêm bình luận!" });
  }
};

// Lấy danh sách bình luận của ảnh
exports.getComments = async (req, res) => {
  const { id } = req.params; // ID của ảnh

  try {
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: "Không tìm thấy ảnh!" });
    }

    res.status(200).json(photo.comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Lỗi khi lấy bình luận!" });
  }
};

// Xóa ảnh
exports.deletePhoto = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPhoto = await Photo.findByIdAndDelete(id);
    if (!deletedPhoto) {
      return res.status(404).json({ message: "Không tìm thấy ảnh để xóa!" });
    }
    res.status(200).json({ message: "Xóa ảnh thành công!" });
  } catch (error) {
    console.error("Error deleting photo:", error);
    res.status(500).json({ message: "Lỗi khi xóa ảnh!" });
  }
};