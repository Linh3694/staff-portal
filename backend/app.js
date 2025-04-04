// app.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

require("dotenv").config();

// Import các route
const authRoutes = require("./routes/auth");
const authMicrosoftRoutes = require("./routes/authMicrosoft");
const laptopRoutes = require("./routes/laptops");
const monitorRoutes = require("./routes/monitors");
const printerRoutes = require("./routes/printers");
const projectorRoutes = require("./routes/projectors");
const toolRoutes = require("./routes/tool");
const roomRoutes = require("./routes/room");
const userRoutes = require("./routes/users");
const clientsSync = require('./routes/clientsSync');
const activityRoutes = require('./routes/activityRoutes');
const ticketRoutes = require("./routes/tickets");
const inspectRoutes = require("./routes/inspect");
const studentRoutes = require("./routes/students");
const documentRoutes = require("./routes/documents");
const pdfRoutes = require("./routes/pdf");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const networkDevicesRoutes = require("./routes/networkDevices");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const familyRoutes = require("./routes/familyRoutes");
const schoolYearRoutes = require("./routes/schoolYearRoutes");
const classRoutes = require("./routes/classRoutes");
const enrollmentRoutes = require("./routes/studentClassEnrollmentRoutes");
const photoRoutes = require("./routes/photoRoutes");
const awardRecordRoutes = require("./routes/awardRecordRoutes");
const awardCategoryRoutes = require("./routes/awardCategoryRoutes");
const routeRoutes = require("./routes/routeRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const tripRoutes = require("./routes/tripRoutes");
const dailyTripRoutes = require("./routes/dailyTripRoutes");
const libraryRoutes = require("./routes/library");

const app = express();

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

// Đảm bảo thư mục uploads tồn tại
const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json({ limit: "4096mb" }));
app.use(express.urlencoded({ limit: "4096mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadPath));

// Cấu hình session và passport
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 1 ngày
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Định tuyến
app.use("/api/auth", authRoutes);
app.use("/api/auth", authMicrosoftRoutes);
app.use("/api/laptops", laptopRoutes);
app.use("/api/monitors", monitorRoutes);
app.use("/api/printers", printerRoutes);
app.use("/api/projectors", projectorRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients-sync", clientsSync.router);
app.use("/api/tools", toolRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/inspects", inspectRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/flippage", pdfRoutes);
app.use("/api/network-devices", networkDevicesRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/schoolyears", schoolYearRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/award-records", awardRecordRoutes); 
app.use("/api/award-categories", awardCategoryRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/daily-trips", dailyTripRoutes);
app.use("/api/libraries", libraryRoutes);
app.use("/api/email", require("./routes/emailRoutes"));

// Khởi động server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

require("./cronEmail");

module.exports = app;