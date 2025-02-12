const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const authenticate = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadTicket");



// a) Tạo ticket
router.post("/", authenticate, upload.array("attachments", 15), ticketController.createTicket);

// b) Lấy danh sách tickets
router.get("/", authenticate, ticketController.getTickets);

// c) Cập nhật ticket
router.put("/:ticketId", authenticate, ticketController.updateTicket);

// d) Thêm phản hồi (feedback)
router.post("/:ticketId/feedback", authenticate, ticketController.addFeedback);

// e) Escalation (thăng cấp ticket)
router.post("/:ticketId/escalate", authenticate, ticketController.escalateTicket);


module.exports = router;