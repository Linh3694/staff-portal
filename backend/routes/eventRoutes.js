const express = require("express");
const router = express.Router();
const uploadEvent = require("../middleware/uploadEvent"); // Middleware dành cho Events
const eventController = require("../controllers/eventController");

router.get("/", eventController.getAllEvents);
router.get("/:id", eventController.getEventById);
router.post("/", uploadEvent.single("image"), eventController.createEvent); // Sử dụng middleware uploadEvent
router.put("/:id", uploadEvent.single("image"), eventController.updateEvent); // Sử dụng middleware uploadEvent
router.delete("/:id", eventController.deleteEvent);
router.get("/events", eventController.getEventBySlug); // Thêm route mới

module.exports = router;