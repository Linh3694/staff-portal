const Ticket = require("../models/Ticket");
const User = require("../models/Users"); // Import model User nếu chưa import

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
  const { ticketId } = req.params; // ID ticket từ params
  const updates = req.body; // Dữ liệu cập nhật từ request body
  const userId = req.user.id; // ID user từ token

  try {
    const ticket = await Ticket.findById(ticketId); // Lấy ticket từ DB

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    console.log("Ticket hiện tại:", ticket);
    // Kiểm tra nếu trạng thái chuyển sang "processing"
    console.log("Received updates:", updates);
    // Cập nhật các thông tin khác
    Object.assign(ticket, updates);

    if (updates.status === "Processing") {
      console.log("Chuyển trạng thái sang 'processing', cập nhật SLA Phase 2");

      // Thời gian SLA Phase 2 theo priority
      const slaDurations = { Low: 72, Medium: 48, High: 24, Urgent: 4 }; // Đơn vị: giờ
      const priority = updates.priority || ticket.priority; // Lấy priority mới hoặc giữ nguyên

      let slaDeadline = new Date(); // Thời gian hiện tại

      // Tính thời gian SLA Phase 2
      slaDeadline.setHours(slaDeadline.getHours() + slaDurations[priority]);

      ticket.sla = slaDeadline; // Gán giá trị SLA Phase 2 mới
      ticket.history.push({
        timestamp: new Date(),
        action: `Ticket moved to processing, SLA updated to ${slaDeadline}, priority=${priority}`,
        user: req.user.id,
      });

      console.log("SLA Phase 2 mới:", slaDeadline);
    }

    // Lưu ticket vào DB
    await ticket.save()
    .then((result) => console.log("Kết quả lưu:", result))
    .catch((err) => console.error("Lỗi khi lưu:", err));
    console.log("Ticket đã được lưu thành công:", ticket);
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("Lỗi khi cập nhật ticket:", error);
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi cập nhật ticket" });
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
        action: `User added first rating=${rating}${
          comment ? `, comment="${comment}"` : ""
        }`,
        user: req.user.id,
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
        action: `User updated rating from ${oldRating} to ${rating}, comment="${comment}"`,
        user: req.user.id,
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
      action: `Ticket escalated to level ${ticket.escalateLevel}`,
      user: req.user.id,
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
    status: { $in: ["Open", "In Progress"] },
    sla: { $lt: new Date() },
  });

  tickets.forEach(async (ticket) => {
    ticket.escalateLevel += 1;
    ticket.history.push({
      timestamp: new Date(),
      action: `SLA breached. Ticket escalated to level ${ticket.escalateLevel}`,
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
    // Lấy ticket
    const ticket = await Ticket.findById(ticketId).populate("creator assignedTo");
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket không tồn tại",
      });
    }
    const creatorId = ticket.creator ? ticket.creator.toString() : null;
    const assignedId = ticket.assignedTo ? ticket.assignedTo.toString() : null;

    const isParticipant =
    ticket.creator.equals(req.user._id) || 
    (ticket.assignedTo && ticket.assignedTo.equals(req.user._id));


    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chat trong ticket này",
      });
    }

    // Thêm tin nhắn mới vào mảng messages
    ticket.messages.push({
      sender: req.user._id, // user đang đăng nhập
      text,
      timestamp: new Date(),
    });

    // Ghi nhật ký
    ticket.history.push({
      timestamp: new Date(),
      action: `User ${req.user.id} sent a message`,
      user: req.user.id,
    });

    await ticket.save();

    return res.status(200).json({
      success: true,
      message: "Gửi tin nhắn thành công",
      ticket,
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

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại!" });
    }

    // 🔍 Chuyển đổi `assignedTo` từ tên → ObjectId
    const assignedUser = await User.findOne({ fullname: assignedTo });
    if (!assignedUser) {
      return res.status(400).json({ success: false, message: "Người dùng được giao không tồn tại!" });
    }

    // 🟡 Kiểm tra giá trị hợp lệ của `status`
    const validStatuses = ["In Progress", "Completed", "Cancelled"];
    const finalStatus = validStatuses.includes(status) ? status : "In Progress"; // Mặc định In Progress nếu sai

    const newSubTask = {
      title,
      assignedTo: assignedUser._id, // ✅ Gán đúng ObjectId
      status: finalStatus,
      createdAt: new Date(),
    };

    ticket.subTasks.push(newSubTask);
    await ticket.save();

    // 🔄 Fetch lại ticket ngay sau khi thêm subtask
    const updatedTicket = await Ticket.findById(ticketId).populate("subTasks.assignedTo", "fullname email");

    res.status(201).json({ success: true, ticket: updatedTicket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSubTaskStatus = async (req, res) => {
  try {
    const { ticketId, subTaskId } = req.params;
    const { status } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    const subTask = ticket.subTasks.id(subTaskId);
    if (!subTask) {
      return res.status(404).json({ success: false, message: "Sub-task không tồn tại" });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ["In Progress", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ!" });
    }

    // Cập nhật trạng thái subtask
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

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket không tồn tại" });
    }

    ticket.subTasks = ticket.subTasks.filter(sub => sub._id.toString() !== subTaskId);
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

// Lấy supportTeam (sử dụng ticket đầu tiên)
exports.getSupportTeam = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({}).populate("supportTeam.members", "fullname jobTitle avatarUrl");
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Chưa có ticket nào!" });
    }

    // Tính rating và huy hiệu cho từng thành viên trong team
    const membersWithStats = [];
    for (const member of ticket.supportTeam.members) {
      // Tìm tất cả ticket có assignedTo bằng member._id và feedback.rating tồn tại
      const tickets = await Ticket.find({
  assignedTo: member._id,
        "feedback.rating": { $exists: true },
      });
      let sumRating = 0;
      let totalFeedbacks = 0;
      const badgesCount = {};

      tickets.forEach((tk) => {
        if (tk.feedback && tk.feedback.rating) {
          sumRating += tk.feedback.rating;
          totalFeedbacks += 1;
        }
        if (tk.feedback && Array.isArray(tk.feedback.badges)) {
          tk.feedback.badges.forEach((b) => {
            badgesCount[b] = (badgesCount[b] || 0) + 1;
          });
        }
      });

      const averageRating = totalFeedbacks ? sumRating / totalFeedbacks : 0;
      membersWithStats.push({
        _id: member._id,
        fullname: member.fullname,
        jobTitle: member.jobTitle,
        avatarUrl: member.avatarUrl,
        averageRating,
        badgesCount,
      });
    }

    res.status(200).json({
      success: true,
      teamName: ticket.supportTeam.name,
      members: membersWithStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm user vào supportTeam
exports.addUserToSupportTeam = async (req, res) => {
  try {
    const { userId } = req.body;

    // Kiểm tra tính hợp lệ của userId
    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin userId" });
    }

    // Tìm ticket đầu tiên (vì chỉ có 1 team duy nhất)
    const ticket = await Ticket.findOne({});
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Chưa có ticket nào!" });
    }

    // Kiểm tra user có tồn tại
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User không tồn tại!" });
    }

    // Kiểm tra nếu user đã có trong team
    if (ticket.supportTeam.members.some((m) => m.toString() === userId)) {
      return res.status(400).json({ success: false, message: "User đã có trong team!" });
    }

    ticket.supportTeam.members.push(userId);
    await ticket.save();

    res.status(200).json({ success: true, message: "Đã thêm user vào supportTeam" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// (Tuỳ chọn) Xoá user khỏi supportTeam
exports.removeUserFromSupportTeam = async (req, res) => {
  try {
    const { userId } = req.body;
    const ticket = await Ticket.findOne({});
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Chưa có ticket nào!" });
    }

    ticket.supportTeam.members = ticket.supportTeam.members.filter(
      (m) => m.toString() !== userId
    );
    await ticket.save();

    res.status(200).json({ success: true, message: "Đã xoá user khỏi team" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    url: `${process.env.BASE_URL}/uploads/Tickets/${file.filename}`,
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
        action: `Ticket created and assigned to ${leastAssignedUser.fullname}`,
        user: creatorId,
      },
    ],
  });

  await newTicket.save();
  return newTicket;
}
exports.createTicketHelper = createTicketHelper;