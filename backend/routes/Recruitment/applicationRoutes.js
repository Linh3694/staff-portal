const express = require("express");
const router = express.Router();
const applicationController = require("../../controllers/Recruitment/applicationController");
const upload = require("../../middleware/uploadCV");

router.post("/", upload.single("cvFile"), applicationController.submitApplication);
router.get("/", applicationController.getApplications);
router.get("/job/:jobId", applicationController.getApplicationsByJob);

module.exports = router;