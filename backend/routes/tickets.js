const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const authenticate = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadTicket");



// a) Tạo ticket
router.post("/", authenticate, upload.array("attachments", 15), ticketController.createTicket);
router.get("/technical-stats/:userId", ticketController.getTechnicalStats);
// b) Lấy danh sách tickets
router.get("/support-team", ticketController.getSupportTeam);

router.get("/", authenticate, ticketController.getTickets);
router.get("/:ticketId", authenticate, ticketController.getTicketById);

// c) Cập nhật ticket
router.put("/:ticketId", authenticate, ticketController.updateTicket);

// d) Thêm phản hồi (feedback)
router.post("/:ticketId/feedback", authenticate, ticketController.addFeedback);

// e) Escalation (thăng cấp ticket)
router.post("/:ticketId/escalate", authenticate, ticketController.escalateTicket);

// f) Message 
router.post("/:ticketId/messages", authenticate, ticketController.sendMessage);

router.post("/:ticketId/subtasks", authenticate, ticketController.addSubTask);

router.get("/:ticketId/subtasks", authenticate, ticketController.getSubTasksByTicket);

router.put("/:ticketId/subtasks/:subTaskId", authenticate, ticketController.updateSubTaskStatus);

router.delete("/:ticketId/subtasks/:subTaskId", authenticate, ticketController.deleteSubTask);

router.post("/support-team/add-user", ticketController.addUserToSupportTeam);
router.post("/support-team/remove-user", ticketController.removeUserFromSupportTeam);

module.exports = router;