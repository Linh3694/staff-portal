// routes/familyRoutes.js
const express = require("express");
const router = express.Router();

const familyController = require("../controllers/familyController");

// CRUD
router.post("/", familyController.createFamily);
router.get("/", familyController.getAllFamilies);
router.get("/:id", familyController.getFamilyById);
router.put("/:id", familyController.updateFamily);
router.delete("/:id", familyController.deleteFamily);

module.exports = router;