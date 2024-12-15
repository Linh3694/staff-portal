const jwt = require("jsonwebtoken");
const User = require("../models/Users");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Giải mã token để lấy thông tin user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Truy vấn thông tin người dùng từ database
    const user = await User.findById(decoded.id).select('fullname email role');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Thêm thông tin người dùng vào req.user
    req.user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    };
    console.log('User in Middleware:', req.user);
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

module.exports = authMiddleware;