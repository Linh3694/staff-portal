const User = require("../models/Users"); // Correct import path for User model
const bcrypt = require("bcryptjs"); // Import bcrypt for password hashing

exports.updateAvatar = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cập nhật avatar
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Get Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Exclude password for security
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Create User
exports.createUser = async (req, res) => {
  const { fullname, email, password, role, jobTitle, department } = req.body;

  // Validate required fields
  if (!fullname || !email || !password || !role) {
    return res.status(400).json({ message: "Please provide all required information." });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword, // Save hashed password
      role,
      jobTitle: jobTitle || "Not provided", // Default value if not provided
    });

    await newUser.save();

    // Return success message
    res.status(201).json({
      message: "User created successfully!",
      user: {
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role,
        jobTitle: newUser.jobTitle,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, email, role, status, password } = req.body;
    const updates = { fullname, email, role, status };

    // Validate required fields
    if (!fullname || !email) {
      return res.status(400).json({ message: "Missing required information." });
    }

    // Hash new password if provided
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(400).json({ message: "Error deleting user", error: error.message });
  }
};