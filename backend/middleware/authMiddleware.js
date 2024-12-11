const jwt = require("jsonwebtoken");
const User = require("../models/Clients");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Giải mã token để lấy thông tin user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user trong database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Gắn thông tin user vào req
    req.user = { id: user._id, username: user.name }; // Đảm bảo có `username` cho middleware
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

module.exports = authMiddleware;