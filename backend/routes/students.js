const express = require("express");
const multer = require("multer");
const router = express.Router();
const studentController = require("../controllers/studentController");


const upload = multer({ dest: "uploads/" }); // Temporary folder to store uploads

const path = require("path");
console.log("Upload directory:", path.resolve("uploads/"));

// GET all
router.get("/", studentController.getAllStudents);

// GET one
router.get("/:id", studentController.getStudentById);

// POST create
router.post("/", studentController.createStudent);

// PUT update
router.put("/:id", studentController.updateStudent);

// DELETE remove
router.delete("/:id", studentController.deleteStudent);

router.post("/upload", upload.single("file"), studentController.uploadExcel);


module.exports = router;