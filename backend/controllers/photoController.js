const Photo = require("../models/Photos");
const Event = require("../models/Events");
const mongoose = require("mongoose");

// Lấy danh sách ảnh theo ID sự kiện
exports.getPhotosByEvent = async (req, res) => {
  const { eventId, userId } = req.query;

  if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "ID sự kiện không hợp lệ!" });
  }

  try {
    let filter = { eventId, approved: true };

    // Nếu có userId, chỉ lấy bài dự thi của user đó
    if (userId) {
      filter.uploaderId = userId;
    }

    const photos = await Photo.find(filter).select("uploaderId uploaderName url title votes message voters createdAt");

    if (!photos.length) {
      return res.status(200).json([]); // Trả về mảng rỗng thay vì lỗi 404
    }

    res.status(200).json(photos);
  } catch (error) {
    console.error("❌ Lỗi khi lấy ảnh:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ảnh!" });
  }
};

// Thêm ảnh mới
exports.uploadPhoto = async (req, res) => {
  console.log(req.body);
  console.log(req.file);

  const { eventId, title, message, uploaderName } = req.body;
  const url = `/uploads/Events/${req.file?.filename}`; // Đường dẫn file

  try {
    const event = await Event.findById(eventId); // Kiểm tra sự kiện có tồn tại không
    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện!" });
    }

    // Tạo ảnh mới với trạng thái "chưa phê duyệt"
    const newPhoto = new Photo({ eventId, title, url, message, uploaderName, approved: false });
    await newPhoto.save();
    res.status(201).json({ message: "Ảnh đã được tải lên và chờ phê duyệt!", newPhoto });
  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).json({ message: "Lỗi khi tải ảnh lên!" });
  }
};

exports.getPendingPhotos = async (req, res) => {
  try {
    const pendingPhotos = await Photo.find({ approved: false, denied: false }); // Không lấy ảnh đã bị từ chối
    res.status(200).json(pendingPhotos);
  } catch (error) {
    console.error("Error fetching pending photos:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ảnh chưa được phê duyệt!" });
  }
};

exports.getApprovedPhotos = async (req, res) => {
  try {
    const approvedPhotos = await Photo.find({ approved: true, denied: false });
    res.status(200).json(approvedPhotos);
  } catch (error) {
    console.error("Error fetching approved photos:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ảnh đã duyệt!" });
  }
};

exports.getDeniedPhotos = async (req, res) => {
  try {
    const deniedPhotos = await Photo.find({ denied: true });
    res.status(200).json(deniedPhotos);
  } catch (error) {
    console.error("Error fetching denied photos:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách ảnh đã bị từ chối!" });
  }
};

exports.approvePhoto = async (req, res) => {
  const { id } = req.params;
  try {
    // Lưu ý: cần “phủ” denied = false
    const photo = await Photo.findByIdAndUpdate(
      id,
      { approved: true, denied: false },
      { new: true }
    );

    if (!photo) {
      return res.status(404).json({ message: "Không tìm thấy ảnh!" });
    }
    res.status(200).json({ message: "Ảnh đã được phê duyệt!", photo });
  } catch (error) {
    console.error("Error approving photo:", error);
    res.status(500).json({ message: "Lỗi khi phê duyệt ảnh!" });
  }
};

exports.rejectPhoto = async (req, res) => {
  const { id } = req.params;
  try {
    // Cập nhật ảnh để đảm bảo nó bị từ chối và không còn pending
    const photo = await Photo.findByIdAndUpdate(
      id,
      { denied: true, approved: false },
      { new: true }
    );

    if (!photo) {
      return res.status(404).json({ message: "Không tìm thấy ảnh!" });
    }

    res.status(200).json({ message: "Ảnh đã bị từ chối!", photo });
  } catch (error) {
    console.error("Error rejecting photo:", error);
    res.status(500).json({ message: "Lỗi khi từ chối ảnh!" });
  }
};

// Vote cho ảnh
exports.votePhoto = async (req, res) => {
  try {
    const { id } = req.params; // ID ảnh
    const { userId } = req.body; // ID người dùng

    console.log("🟡 Nhận yêu cầu vote từ client:", { id, userId });

    if (!userId) {
      return res.status(400).json({ message: "Thiếu userId!" });
    }

    // Tìm ảnh trong database
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: "Ảnh không tồn tại!" });
    }

    console.log("✅ Ảnh tìm thấy:", photo);

    const hasVoted = photo.votedUsers.includes(userId);

    // Nếu đã vote -> Bỏ vote
    if (hasVoted) {
      await Photo.findByIdAndUpdate(id, {
        $pull: { votedUsers: userId }, // Xóa userId khỏi danh sách vote
        $inc: { votes: -1 } // Giảm số vote đi 1
      });
      console.log("❌ Người dùng đã bỏ vote:", userId);
      return res.status(200).json({ isVoted: false, votes: Math.max(0, photo.votes - 1) });
    } 
    // Nếu chưa vote -> Vote
    else {
      await Photo.findByIdAndUpdate(id, {
        $push: { votedUsers: userId }, // Thêm userId vào danh sách vote
        $inc: { votes: 1 } // Tăng số vote lên 1
      });
      console.log("❤️ Người dùng đã vote:", userId);
      return res.status(200).json({ isVoted: true, votes: photo.votes + 1 });
    }
  } catch (error) {
    console.error("❌ Lỗi khi thả/bỏ vote:", error);
    return res.status(500).json({ message: "Lỗi server!" });
  }
};

// Thêm bình luận vào ảnh
exports.addComment = async (req, res) => {
  console.log(req.params)
  console.log(req.body)
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

exports.getLeaderboard = async (req, res) => {
  const { eventId } = req.query;

  try {
    const leaderboard = await Photo.find({ eventId, approved: true })
      .sort({ votes: -1 }) // Sắp xếp giảm dần theo số vote
      .select("uploaderName title votes url eventId message comments"); // Thêm trường url để trả về ảnh
    
      res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard." });
  }
};

// Lấy leaderboard của tất cả sự kiện (thử thách)
exports.getLeaderboardAll = async (req, res) => {
  try {
    // Lấy danh sách tất cả các sự kiện
    const events = await Event.find().select("_id name number"); 

    if (!events.length) {
      return res.status(404).json({ message: "Không tìm thấy thử thách nào!" });
    }

    // Lấy danh sách ảnh từ tất cả thử thách (eventId)
    const leaderboardData = await Promise.all(
      events.map(async (event) => {
        const photos = await Photo.find({ eventId: event._id, approved: true })
          .sort({ votes: -1 }) // Sắp xếp theo số vote giảm dần
          .select("uploaderName title votes url eventId message createdAt comments");

        return {
          eventId: event._id,
          eventName: event.name,
          eventNumber: event.number,
          photos,
        };
      })
    );

    res.status(200).json(leaderboardData);
  } catch (error) {
    console.error("Error fetching leaderboard for all events:", error);
    res.status(500).json({ message: "Lỗi khi lấy leaderboard của tất cả sự kiện." });
  }
};


// Lấy chi tiết ảnh theo ID
exports.getPhotoById = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query; // Nhận userId từ query params

  try {
    // Tìm ảnh theo ID
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: "Không tìm thấy ảnh!" });
    }

    // Kiểm tra nếu người dùng đã vote hay chưa
    const isVoted = userId ? photo.votedUsers.includes(userId) : false;

    // Trả về thông tin chi tiết ảnh
    res.status(200).json({ ...photo.toObject(), isVoted });
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết ảnh:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin ảnh!" });
  }
};

exports.getPhotoCounts = async (req, res) => {
  try {
    const eventIds = req.query.eventIds ? req.query.eventIds.split(",") : [];
    
    if (eventIds.length === 0) {
      return res.status(400).json({ error: "Missing eventIds parameter" });
    }

    const counts = await Photo.aggregate([
      { $match: { eventId: { $in: eventIds.map(id => new mongoose.Types.ObjectId(id)) }, approved: true } }, // Chỉ lấy ảnh đã được duyệt
      { $group: { _id: "$eventId", count: { $sum: 1 } } }
    ]);

    const countMap = counts.reduce((acc, { _id, count }) => {
      acc[_id.toString()] = count;
      return acc;
    }, {});

    res.status(200).json(countMap);
  } catch (error) {
    console.error("❌ Lỗi khi lấy số lượng ảnh:", error);
    res.status(500).json({ message: "Lỗi khi lấy số lượng ảnh!" });
  }
};