const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const laptopRoutes = require("./routes/laptops");
const desktopRoutes = require("./routes/desktops"); // Import route desktops
const userRoutes = require("./routes/users");
const validateToken = require("./middleware/validateToken");
const clientsSync = require('./routes/clientsSync'); // Import the clientsSync router


const Laptop = require("./models/Laptop");
const Desktop = require("./models/Desktop"); // Import model Desktop

// Load biến môi trường
require("dotenv").config();

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

// Tạo app Express
const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/laptops", laptopRoutes);
app.use("/api/desktops", desktopRoutes); // Sử dụng route desktops
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes); // Route xác thực
app.use("/api/laptops", laptopRoutes); // Route laptops
app.use("/api/desktops", desktopRoutes); // Route desktops
app.use("/api/users", userRoutes); // Route users
app.use("/api", clientsSync.router); // Use the clientsSync router

const syncClientsFromAzure = require("./routes/clientsSync").syncClientsFromAzure;
app.get("/api/sync-clients", async (req, res) => {
  try {
    await syncClientsFromAzure();
    res.json({ message: "Clients synced successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error syncing clients" });
  }
});

app.post("/api/sync-clients", validateToken, async (req, res) => {
  try {
    await syncClientsFromAzure();
    res.json({ message: "Clients synced successfully!" });
  } catch (error) {
    console.error("Error syncing clients:", error.message);
    res.status(500).json({ error: "Error syncing clients" });
  }
});

// const cron = require("node-cron");

// cron.schedule("0 * * * *", async () => {
//   console.log("Running scheduled client sync...");
//   await syncClientsFromAzure();
// });

// Bulk upload Laptops
app.post("/api/laptops/bulk-upload", async (req, res) => {
  try {
    const laptops = req.body.laptops;

    if (!laptops || !Array.isArray(laptops)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const invalidLaptops = laptops.filter(
      (laptop) =>
        !laptop.name || !laptop.manufacturer || !laptop.serial || !laptop.status
    );

    if (invalidLaptops.length > 0) {
      return res.status(400).json({
        message: "Có laptop không hợp lệ, kiểm tra lại dữ liệu!",
        invalidLaptops,
      });
    }

    await Laptop.insertMany(laptops);
    res.status(201).json({ message: "Tải dữ liệu lên thành công!" });
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu lên:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

// Bulk upload Desktops
app.post("/api/desktops/bulk-upload", async (req, res) => {
  try {
    const desktops = req.body.desktops;

    if (!desktops || !Array.isArray(desktops)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

    const invalidDesktops = desktops.filter(
      (desktop) =>
        !desktop.name || !desktop.manufacturer || !desktop.serial || !desktop.status
    );

    if (invalidDesktops.length > 0) {
      return res.status(400).json({
        message: "Có desktop không hợp lệ, kiểm tra lại dữ liệu!",
        invalidDesktops,
      });
    }

    await Desktop.insertMany(desktops);
    res.status(201).json({ message: "Tải dữ liệu lên thành công!" });
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu lên:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error });
  }
});

app.use(express.static('build', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});