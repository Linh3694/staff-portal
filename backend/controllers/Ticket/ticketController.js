
const Ticket = require("../../models/Ticket");
const User = require("../../models/Users"); // Import model User nếu chưa import
const SupportTeam = require("../../models/SupportTeam");
const notificationController = require('../Notification/notificationController'); // Thêm import
const mongoose = require("mongoose");


function getVNTimeString() {
  const now = new Date();
  // Định dạng giờ, phút, ngày, tháng, năm theo múi giờ Việt Nam
  const options = {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  // Kết quả dạng: dd/mm/yyyy, hh:mm:ss
  // Ta chỉ lấy: hh:mm (GMT+7) dd/mm/yyyy
  const formatted = new Intl.DateTimeFormat("vi-VN", options).format(now);
  // Tuỳ vào cấu trúc trả về, có thể cần tách chuỗi, nhưng ở mức đơn giản, 
  // bạn có thể thêm thủ công (GMT+7) vào sau:
  return `${formatted}`;
}

function translateStatus(status) {
  const statusMap = {
    "Assigned": "Đã nhận",
    "Processing": "Đang xử lý",
    "In Progress": "Đang xử lý",
    "Completed": "Hoàn thành",
    "Done": "Hoàn thành",
    "Cancelled": "Đã huỷ",
    "Waiting for Customer": "Chờ phản hồi",
    "Closed": "Đã đóng",
  };

  return statusMap[status] || status;
}


// a) Tạo ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, creator, notes } = req.body;

   const newTicket = await createTicketHelper({
     title,
     description,
     priority,
     creatorId: creator,
     files: req.files || [],
   });
    // notes
   newTicket.notes = notes || "";
   await newTicket.save();

    // Gửi thông báo đến admin và technical
    await notificationController.sendNewTicketNotification(newTicket);

    res.status(201).json({ success: true, ticket: newTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// a) Lấy danh sách ticket
exports.getTickets = async (req, res) => {
    console.log("🔵 Kiểm tra req.user:", req.user); // ✅ Kiểm tra user có tồn tại không

  const { status, priority } = req.query;
  const userId = req.user._id; // Lấy ID user từ token
  try {
    let query = {};
    if (req.user.role === "superadmin") {
      query = {};
    } else {
      // Các role khác: xem ticket mà họ tạo ra hoặc được gán cho họ
      query = { $or: [{ creator: userId }, { assignedTo: userId }] };
    }

    if (status === "assignedOrProcessing") {
      query.status = { $in: ["Assigned", "Processing"] };
    } else if (status) {
      // Các trường hợp khác
      query.status = status;
    }
    if (priority) query.priority = priority;

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 }) // Sắp xếp giảm dần theo createdAt
      .populate("creator assignedTo");
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ví dụ thêm 1 API getTicketById
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate("creator assignedTo")
      .populate({
        path: "messages.sender",
        model: "User",  // Đảm bảo đúng model User
        select: "fullname avatarUrl email",  // ✅ Chỉ lấy fullname, avatarUrl, email
      })
      // Bổ sung populate cho subTasks.assignedTo:
      .populate({
        path: "subTasks.assignedTo",
        model: "User",
        select: "fullname email avatarUrl",
      });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("Lỗi khi lấy ticket:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// c) Cập nhật ticket
exports.updateTicket = async (req, res) => {
  const { ticketId } = req.params;
  const updates = req.body;
  const userId = req.user.id; // user đang đăng nhập

  try {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    console.log("Ticket hiện tại:", ticket);
    console.log("Received updates:", updates);

    // Ghi log nếu status thay đổi
    if (updates.status && updates.status !== ticket.status) {
      ticket.history.push({
        timestamp: new Date(),
        action: `Người dùng <strong>${req.user.fullname}</strong> đã thay đổi trạng thái ticket từ <strong>"${translateStatus(ticket.status)}"</strong> sang <strong>"${translateStatus(updates.status)}"</strong> vào lúc <strong>${getVNTimeString()}</strong>`,
        user: req.user._id,
      });
    }

    // Nếu có cancelReason, ghi log
    if (updates.status === "Cancelled" && updates.cancelReason) {
      ticket.history.push({
        timestamp: new Date(),
        action: `Người dùng <strong>${req.user.fullname}</strong> đã huỷ ticket với lý do: <strong>"${updates.cancelReason}"</strong> vào lúc <strong>${getVNTimeString()}</strong>`,
        user: req.user._id,
      });
    }

    Object.assign(ticket, updates);

    // Nếu chuyển sang Processing -> cập nhật SLA Phase 2
    if (updates.status === "Processing") {
      const slaDurations = { Low: 72, Medium: 48, High: 24, Urgent: 4 };
      const priority = updates.priority || ticket.priority;
      let slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + slaDurations[priority]);
      ticket.sla = slaDeadline;
      ticket.history.push({
        timestamp: new Date(),
        action: `Người dùng <strong>${req.user.fullname}</strong> đã chuyển ticket sang <strong>"Đang xử lý"</strong>  vào lúc <strong>${getVNTimeString()}</strong>`,
        user: req.user._id,
      });
    }

    await ticket.save();
    console.log("Ticket đã được lưu thành công:", ticket);

    // Xác định loại hành động để gửi thông báo phù hợp
    let action = 'updated';
    if (req.body.status && ticket.status !== previousStatus) {
      action = 'status_updated';
    } else if (req.body.assignedTo && !previousAssignedTo.equals(ticket.assignedTo)) {
      action = 'assigned';
    }

    // Gửi thông báo cập nhật
    await notificationController.sendTicketUpdateNotification(ticket, action);

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("Lỗi khi cập nhật ticket:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật ticket",
    });
  }
};

// d) Thêm phản hồi
exports.addFeedback = async (req, res) => {
  const { ticketId } = req.params;
  const { rating, comment, badges } = req.body; // thêm badges

  try {
    const ticket = await Ticket.findById(ticketId);

    // Kiểm tra xem lần đầu đánh giá hay đã đánh giá trước đó
    const hasPreviousRating = !!ticket.feedback?.rating; // true/false

    if (!hasPreviousRating) {
      // Lần đầu đánh giá:
      // - Không bắt buộc comment
      if (!rating) {
        return res.status(400).json({
          success: false,
          message: "Bạn phải chọn số sao để đánh giá.",
        });
      }

      // Gán giá trị feedback
      ticket.feedback = {
        assignedTo: ticket.assignedTo, 
        rating,
        comment: comment || "", // comment không bắt buộc, nếu không có thì lưu chuỗi rỗng
        badges: badges || [], // Gán mảng huy hiệu
      };

      ticket.history.push({
        timestamp: new Date(),
        action: `Người dùng <strong>${req.user.fullname}</strong> đã đánh giá lần đầu (<strong>${rating}</strong> sao${comment ? `, nhận xét: "<strong>${comment}</strong>"` : ""}) vào lúc <strong>${getVNTimeString()}</strong>`,
        user: req.user._id,
      });

    } else {
      // Đã có rating trước đó => cập nhật rating
      // - Bắt buộc phải có comment giải thích tại sao muốn đổi
      if (!rating) {
        return res.status(400).json({
          success: false,
          message: "Bạn phải chọn số sao để cập nhật đánh giá.",
        });
      }
      if (!comment) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập nhận xét khi thay đổi đánh giá.",
        });
      }

      const oldRating = ticket.feedback.rating;
      ticket.feedback.assignedTo = ticket.assignedTo;
      ticket.feedback.rating = rating;
      ticket.feedback.comment = comment;
      ticket.feedback.badges = badges || [];

      ticket.history.push({
  timestamp: new Date(),
  action: `Người dùng <strong>${req.user.fullname}</strong> đã cập nhật đánh giá từ <strong>${oldRating}</strong> lên <strong>${rating}</strong> sao, nhận xét: "<strong>${comment}</strong>" vào lúc <strong>${getVNTimeString()}</strong>`,
  user: req.user._id,
});
    }

    await ticket.save();
    return res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTechnicalStats = async (req, res) => {
  try {
    // Giả sử req.params.userId là ID của technical ta muốn xem thống kê
    const { userId } = req.params;

    // Tìm tất cả ticket có assignedTo = userId, feedback.rating tồn tại
    const tickets = await Ticket.find({
      assignedTo: userId,
      "feedback.rating": { $exists: true }
    });

    if (!tickets.length) {
      return res.status(200).json({
        success: true,
        averageRating: 0,
        totalFeedbacks: 0,
        badgesCount: {}
      });
    }

    // 1) Tính trung bình rating
    const totalFeedbacks = tickets.length;
    const sumRating = tickets.reduce((sum, t) => sum + t.feedback.rating, 0);
    const averageRating = sumRating / totalFeedbacks;

    // 2) Thống kê huy hiệu
    // feedback.badges là 1 mảng, ta gộp tất cả mảng -> count frequency
    const badgesCount = {}; // { 'Nhiệt Huyết': 2, 'Chu Đáo': 3, ... }
    tickets.forEach(t => {
      if (t.feedback.badges && Array.isArray(t.feedback.badges)) {
        t.feedback.badges.forEach(badge => {
          badgesCount[badge] = (badgesCount[badge] || 0) + 1;
        });
      }
    });

    res.status(200).json({
      success: true,
      averageRating,
      totalFeedbacks,
      badgesCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// e) Escalation
exports.escalateTicket = async (req, res) => {
  const { ticketId } = req.params;

  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    ticket.escalateLevel += 1;
    ticket.history.push({
      timestamp: new Date(),
      action: `Người dùng ${req.user.fullname} đã nâng cấp ticket lên mức ${ticket.escalateLevel} vào lúc ${getVNTimeString()}`,
      user: req.user._id,
    });

    await ticket.save();

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// f) SLA checking (cron job)
exports.checkSLA = async () => {
  const tickets = await Ticket.find({
    status: { $in: ["In Progress"] },
    sla: { $lt: new Date() },
  });

  tickets.forEach(async (ticket) => {
    ticket.escalateLevel += 1;
    ticket.history.push({
      timestamp: new Date(),
      action: `Hết hạn SLA. Ticket đã được nâng cấp lên mức ${ticket.escalateLevel} vào lúc ${getVNTimeString()}`,
    });

    // Gửi email thông báo (có thể tích hợp sau)
    await ticket.save();
  });

  console.log(`${tickets.length} tickets escalated due to SLA breach.`);
};

// controllers/ticketController.js
exports.sendMessage = async (req, res) => {
  const { ticketId } = req.params;
  const { text } = req.body;

  try {
    const ticket = await Ticket.findById(ticketId).populate("creator assignedTo");
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    // Chỉ creator hoặc assignedTo mới được chat
    const isParticipant =
      ticket.creator.equals(req.user._id) ||
      (ticket.assignedTo && ticket.assignedTo.equals(req.user._id));

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chat trong ticket này",
      });
    }

    // Nếu có file trong req.file => upload ảnh
    if (req.file) {
      // Tạo message kiểu ảnh
      const fileUrl = `${process.env.BASE_URL || "http://localhost:5001"}/uploads/Messages/${req.file.filename}`;
      ticket.messages.push({
        sender: req.user._id,
        text: fileUrl,      // Lưu đường dẫn vào text
        timestamp: new Date(),
        type: "image",      // Đánh dấu để frontend hiểu đây là ảnh
      });
    } else {
      // Tin nhắn text
      if (!text?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Nội dung tin nhắn trống!",
        });
      }
      ticket.messages.push({
        sender: req.user._id,
        text,
        timestamp: new Date(),
        type: "text",
      });
    }

    await ticket.save();
    // Re-fetch ticket để đảm bảo các trường, bao gồm messages với field type, được populate đầy đủ
    const updatedTicket = await Ticket.findById(ticketId)
      .populate("creator assignedTo")
      .populate({
        path: "messages.sender",
        model: "User",
        select: "fullname avatarUrl email",
      });

    // Emit socket event to broadcast new message
    req.app.get("io").to(ticketId).emit("receiveMessage", {
      _id: updatedTicket.messages[updatedTicket.messages.length - 1]._id,
      text: updatedTicket.messages[updatedTicket.messages.length - 1].text,
      sender: updatedTicket.messages[updatedTicket.messages.length - 1].sender,
      timestamp: updatedTicket.messages[updatedTicket.messages.length - 1].timestamp,
      type: updatedTicket.messages[updatedTicket.messages.length - 1].type,
      tempId: req.body.tempId || null,
    });

    // Gửi thông báo có tin nhắn mới
    await notificationController.sendTicketUpdateNotification(ticket, 'comment_added');

    return res.status(200).json({
      success: true,
      message: "Gửi tin nhắn thành công",
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error("Lỗi sendMessage:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi gửi tin nhắn",
    });
  }
};

exports.addSubTask = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { title, assignedTo, status } = req.body;
    const userId = req.user.id;

    const ticket = await Ticket.findById(ticketId).populate("subTasks.assignedTo");
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại!" });
    }

    // Tìm user theo _id hoặc fullname
    let assignedUser = null;
    if (mongoose.Types.ObjectId.isValid(assignedTo)) {
      assignedUser = await User.findById(assignedTo);
    }
    if (!assignedUser) {
      assignedUser = await User.findOne({ fullname: assignedTo });
    }
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: "Người dùng được giao không tồn tại!",
      });
    }

    const validStatuses = ["In Progress", "Completed", "Cancelled"];
    const finalStatus = validStatuses.includes(status) ? status : "In Progress";

    const newSubTask = {
      title,
      assignedTo: assignedUser._id,
      status: finalStatus,
      createdAt: new Date(),
    };

    ticket.subTasks.push(newSubTask);

    // Ghi log
    ticket.history.push({
      timestamp: new Date(),
      action: `Người dùng <strong>${req.user.fullname}</strong> đã tạo subtask <strong>"${title}"</strong>(trạng thái: <strong>${finalStatus}</strong>) vào lúc <strong>${getVNTimeString()}</strong>`,
      user: req.user._id,
    });

    await ticket.save();

    // Populate sau khi thêm
    const updatedTicket = await Ticket.findById(ticketId)
      .populate("creator assignedTo")
      .populate("subTasks.assignedTo");

    res.status(201).json({ success: true, ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSubTaskStatus = async (req, res) => {
  try {
    const { ticketId, subTaskId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const ticket = await Ticket.findById(ticketId).populate("subTasks.assignedTo");
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    const subTask = ticket.subTasks.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ success: false, message: "Sub-task không tồn tại" });
    }

    const validStatuses = ["In Progress", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ!" });
    }

    // Ghi log nếu trạng thái thay đổi
    if (subTask.status !== status) {
      if (subTask.status !== status) {
        ticket.history.push({
          timestamp: new Date(),
          action: `Người dùng <strong>${req.user.fullname}</strong> đã đổi trạng thái subtask <strong>${subTask.title}</strong> từ <strong>${translateStatus(subTask.status)}</strong> sang <strong>${translateStatus(status)}</strong> vào lúc ${getVNTimeString()}`,
          user: req.user._id,
        });
      }
    }

    // Cập nhật subtask
    subTask.status = status;
    subTask.updatedAt = new Date();

    await ticket.save();

    res.status(200).json({ success: true, subTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSubTask = async (req, res) => {
  try {
    const { ticketId, subTaskId } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    const subTask = ticket.subTasks.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ success: false, message: "Sub-task không tồn tại" });
    }

    // Ghi log trước khi xóa
    ticket.history.push({
      timestamp: new Date(),
      action: `Người dùng <strong>${req.user.fullname}</strong> đã xoá subtask <strong>"${subTask.title}"</strong> vào lúc <strong>${getVNTimeString()}</strong>`,
      user: req.user._id,
    });

    ticket.subTasks = ticket.subTasks.filter(
      (s) => s._id.toString() !== subTaskId
    );

    await ticket.save();

    res.status(200).json({ success: true, message: "Sub-task đã được xóa" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubTasksByTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findById(ticketId).populate("subTasks.assignedTo", "fullname email");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    res.status(200).json({ success: true, subTasks: ticket.subTasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy supportTeam
exports.getSupportTeam = async (req, res) => {
  try {
    const result = await SupportTeam.getSupportTeamMembers();
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm user vào supportTeam
exports.addUserToSupportTeam = async (req, res) => {
  try {
    const { userId } = req.body;
    const message = await SupportTeam.addMember(userId);
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// (Tuỳ chọn) Xoá user khỏi supportTeam
exports.removeUserFromSupportTeam = async (req, res) => {
  try {
    const { userId } = req.body;
    const message = await SupportTeam.removeMember(userId, req.user);
    res.status(200).json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


async function createTicketHelper({ title, description, creatorId, priority, files = [] }) {
  // 1) Tính SLA Phase 1 (4h, 8:00 - 17:00)
  const phase1Duration = 4; 
  const startHour = 8;
  const endHour = 17;

  let slaDeadline = new Date();
  const currentHour = slaDeadline.getHours();
  const currentMinute = slaDeadline.getMinutes();

  if (currentHour < startHour || (currentHour === startHour && currentMinute === 0)) {
    slaDeadline.setHours(startHour, 0, 0, 0);
  } else if (currentHour >= endHour || (currentHour === endHour && currentMinute > 0)) {
    slaDeadline.setDate(slaDeadline.getDate() + 1);
    slaDeadline.setHours(startHour, 0, 0, 0);
  }

  let remainingMinutes = phase1Duration * 60;
  while (remainingMinutes > 0) {
    const availableMinutesInDay = endHour * 60 - (slaDeadline.getHours() * 60 + slaDeadline.getMinutes());
    const availableMinutes = Math.min(remainingMinutes, availableMinutesInDay);
    if (availableMinutes <= 0) {
      slaDeadline.setDate(slaDeadline.getDate() + 1);
      slaDeadline.setHours(startHour, 0, 0, 0);
      continue;
    }
    slaDeadline.setMinutes(slaDeadline.getMinutes() + availableMinutes);
    remainingMinutes -= availableMinutes;
  }

  const slaPhase1Deadline = slaDeadline;

  // 2) Tạo ticketCode
  const lastTicket = await Ticket.findOne().sort({ createdAt: -1 });
  let ticketCode = "IT-01";
  if (lastTicket && lastTicket.ticketCode) {
    const lastCode = parseInt(lastTicket.ticketCode.split("-")[1], 10);
    const nextCode = (lastCode + 1).toString().padStart(2, "0");
    ticketCode = `IT-${nextCode}`;
  }

  // 3) Tìm user technical ít ticket nhất
  const technicalUsers = await User.find({ role: "technical" });
  if (!technicalUsers.length) {
    throw new Error("Không có user technical nào để gán!");
  }
  const userTicketCounts = await Promise.all(
    technicalUsers.map(async (u) => {
      const count = await Ticket.countDocuments({ assignedTo: u._id });
      return { user: u, count };
    })
  );
  userTicketCounts.sort((a, b) => a.count - b.count);
  const leastAssignedUser = userTicketCounts[0].user;

  // 4) Tạo attachments
  const attachments = files.map((file) => ({
    filename: file.originalname,
    url: `${file.filename}`,
  }));

  // 5) Tạo ticket
  const newTicket = new Ticket({
    ticketCode,
    title,
    description,
    priority,
    creator: creatorId,
    sla: slaPhase1Deadline,
    assignedTo: leastAssignedUser._id,
    attachments,
    status: "Assigned",
    history: [
      {
        timestamp: new Date(),
        action: `Người dùng <strong>[ID: ${creatorId}]</strong> đã tạo ticket và chỉ định cho <strong>${leastAssignedUser.fullname}</strong> vào lúc <strong>${getVNTimeString()}</strong>`,
        user: creatorId,
      },
    ],
  });

  await newTicket.save();
  return newTicket;
}
exports.createTicketHelper = createTicketHelper;