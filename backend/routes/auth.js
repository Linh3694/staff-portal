const express = require("express");
const router = express.Router();
const User = require("../models/Users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

// Route đăng nhập
router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Invalid email format"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log("User không tồn tại trong DB");
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log("Mật khẩu nhập:", password);
      console.log("Mật khẩu trong DB:", user.password);
      console.log("Mật khẩu hợp lệ:", isPasswordValid); 
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          fullname: user.fullname || "N/A",
          email: user.email || "N/A",
          role: user.role || "user",
          avatar: user.avatar || "https://via.placeholder.com/150",
        },
      });
    } catch (error) {
      console.error("Error logging in:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

module.exports = router;