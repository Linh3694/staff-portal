const cron = require("node-cron");
const { runEmailSync } = require("./controllers/emailController");

// Chạy mỗi 5 phút
cron.schedule("*/30 * * * * *", () => {
  console.log("Đang kiểm tra email...");
  runEmailSync();
});