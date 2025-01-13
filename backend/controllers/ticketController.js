const Ticket = require("../models/Ticket");
const User = require("../models/Users"); // Import model User nếu chưa import

// a) Tạo ticket
exports.createTicket = async (req, res) => {
  const { title, description, priority, creator } = req.body;
  console.log("Priority từ req.body:", req.body.priority);

  try {
    // SLA Phase 1: 4 giờ, chỉ tính trong khoảng 08:00 đến 17:00
    const phase1Duration = 4; // Số giờ trong Phase 1
    const startHour = 8; // Bắt đầu tính giờ từ 8:00 sáng
    const endHour = 17; // Kết thúc tính giờ trong ngày

    let slaDeadline = new Date(); // Lấy thời gian hiện tại
    const currentHour = slaDeadline.getHours();
    const currentMinute = slaDeadline.getMinutes();

    if (currentHour < startHour || (currentHour === startHour && currentMinute === 0)) {
      // Nếu thời gian hiện tại trước 8:00 sáng, bắt đầu từ 8:00 sáng
      slaDeadline.setHours(startHour, 0, 0, 0);
    } else if (currentHour >= endHour || (currentHour === endHour && currentMinute > 0)) {
      // Nếu thời gian hiện tại sau 17:00, chuyển sang 8:00 sáng ngày hôm sau
      slaDeadline.setDate(slaDeadline.getDate() + 1);
      slaDeadline.setHours(startHour, 0, 0, 0);
    }

    let remainingMinutes = phase1Duration * 60; // Tính tổng số phút còn lại
    while (remainingMinutes > 0) {
      console.log(
        `Trước vòng lặp: remainingMinutes=${remainingMinutes}, giờ=${slaDeadline.getHours()}, phút=${slaDeadline.getMinutes()}`
      );

      // Tính số phút có thể sử dụng trong ngày hiện tại
      const availableMinutesInDay = endHour * 60 - (slaDeadline.getHours() * 60 + slaDeadline.getMinutes());
      const availableMinutes = Math.min(remainingMinutes, availableMinutesInDay);

      // Nếu không còn phút nào trong ngày, chuyển sang ngày hôm sau
      if (availableMinutes <= 0) {
        slaDeadline.setDate(slaDeadline.getDate() + 1);
        slaDeadline.setHours(startHour, 0, 0, 0);
        console.log("Chuyển sang ngày mới:", slaDeadline);
        continue; // Quay lại vòng lặp để tính toán lại
      }

      // Cập nhật deadline và giảm số phút còn lại
      slaDeadline.setMinutes(slaDeadline.getMinutes() + availableMinutes);
      remainingMinutes -= availableMinutes;

      console.log(
        `Sau vòng lặp: remainingMinutes=${remainingMinutes}, giờ=${slaDeadline.getHours()}, phút=${slaDeadline.getMinutes()}`
      );
    }

    // SLA Phase 1 chi tiết đến phút
    const slaPhase1Deadline = slaDeadline;

    // Lấy ticket gần nhất để tạo ticketCode
    const lastTicket = await Ticket.findOne().sort({ createdAt: -1 });
    let ticketCode = "IT-01"; // Mã mặc định nếu chưa có ticket nào

    if (lastTicket && lastTicket.ticketCode) {
      const lastCode = parseInt(lastTicket.ticketCode.split("-")[1], 10);
      const nextCode = (lastCode + 1).toString().padStart(2, "0");
      ticketCode = `IT-${nextCode}`;
    }

    // Lấy danh sách user có role "technical"
    const technicalUsers = await User.find({ role: "technical" });

    if (!technicalUsers.length) {
      return res.status(400).json({
        success: false,
        message: "Không có người dùng nào với vai trò 'technical'.",
      });
    }

    // Tìm user ít được gán ticket nhất
    const userTicketCounts = await Promise.all(
      technicalUsers.map(async (user) => {
        const count = await Ticket.countDocuments({ assignedTo: user._id });
        return { user, count };
      })
    );

    // Sắp xếp danh sách theo số lượng ticket đã được gán
    userTicketCounts.sort((a, b) => a.count - b.count);

    // Lấy user ít được gán nhất
    const leastAssignedUser = userTicketCounts[0].user;

    const attachments = req.files.map((file) => ({
      filename: file.originalname,
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
    }));

    // Tạo ticket mới
    const ticket = await Ticket.create({
      ticketCode, // Mã ticket
      title,
      description,
      priority,
      creator,
      sla: slaPhase1Deadline, // SLA Phase 1
      attachments, // Thêm attachments
      assignedTo: leastAssignedUser._id, // Gán cho người dùng ít được gán nhất
      history: [
        {
          timestamp: new Date(),
          action: `Ticket created and assigned to ${leastAssignedUser.fullname}`,
          user: creator,
        },
      ],
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// b) Lấy danh sách ticket
exports.getTickets = async (req, res) => {
  const { status, priority } = req.query;
  const userId = req.user.id; // Lấy ID user từ token

  try {
    const query = req.user.role === "admin" ? {} : { creator: userId };
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await Ticket.find(query)
    .sort({ createdAt: -1 })  // sắp xếp giảm dần theo createdAt
    .populate("creator assignedTo team");

    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  const { rating, comment } = req.body;

  try {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket || (ticket.status !== "Resolved" && ticket.status !== "Closed")) {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be added to resolved or closed tickets",
      });
    }

    ticket.feedback = { rating, comment };
    ticket.history.push({
      timestamp: new Date(),
      action: `User gave feedback rating=${rating} comment=${comment}`,
      user: req.user.id,
    });

    await ticket.save();

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// e) Escalation
exports.escalateTicket = async (req, res) => {
  const { ticketId } = req.params;

  try {
    if (req.user.role !== "admin" && req.user.role !== "manager") {
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

