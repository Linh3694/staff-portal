// backend/routes/awardRecordRoutes.js
const express = require("express");
const router = express.Router();
const awardRecordController = require("../controllers/awardRecordController");

router.get("/", awardRecordController.getAllAwardRecords);
router.get("/:id", awardRecordController.getAwardRecordById);
router.post("/", awardRecordController.createAwardRecord);
router.put("/:id", awardRecordController.updateAwardRecord);
router.delete("/:id", awardRecordController.deleteAwardRecord);

module.exports = router;