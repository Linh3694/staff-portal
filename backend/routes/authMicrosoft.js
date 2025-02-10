// backend/routes/authMicrosoft.js
const express = require("express");
const passport = require("passport");
const { OIDCStrategy } = require("passport-azure-ad");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const router = express.Router();

const azureConfig = require("../config/azure");

// Cấu hình passport strategy với OIDCStrategy
passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${azureConfig.credentials.tenantID}/v2.0/.well-known/openid-configuration`,
      clientID: azureConfig.credentials.clientID,
      clientSecret: azureConfig.credentials.clientSecret,
      responseType: "code",
      responseMode: "query",
      redirectUrl: azureConfig.credentials.callbackURL,
      allowHttpForRedirectUrl: true,
      passReqToCallback: false,
      scope: ["User.Read", "profile", "email", "openid"],
      // Thêm các tuỳ chọn debug
    loggingLevel: "info",
    validateIssuer: false, // Nếu bạn muốn tắt xác thực issuer (đặc biệt là khi dùng multi-tenant)
    },
    // Callback khi nhận được dữ liệu từ Microsoft
    async (iss, sub, profile, accessToken, refreshToken, params, done) => {
        console.log("Bắt đầu callback OIDCStrategy");
        console.log("📢 Dữ liệu từ Microsoft trả về:", JSON.stringify(profile, null, 2));
        console.log("🔑 Access Token:", accessToken);

        if (!profile || !profile._json) {
          console.error("❌ Lỗi: Không nhận được thông tin user từ Microsoft.");
          return done(null, false, { message: "Không nhận được thông tin từ Microsoft" });
        }
      
        try {
        // Lấy email và tên từ profile trả về từ Microsoft
        const email = profile._json.preferred_username;
        const displayName = profile.displayName || "No name";

        // Kiểm tra xem email đã tồn tại trong database chưa
        let user = await User.findOne({ email });
        if (!user) {
          // Nếu chưa tồn tại, tạo mới user với flag needProfileUpdate = true
          user = new User({
            fullname: displayName,
            email,
            password: "", // Vì dùng OAuth nên không cần mật khẩu
            role: "user", // Hoặc giá trị mặc định
            needProfileUpdate: true, // Đánh dấu yêu cầu bổ sung thông tin
          });
          await user.save();
        }
        // Nếu user đã tồn tại, bạn có thể cập nhật thông tin (nếu cần)
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize/Deserialize (nếu dùng session)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Route bắt đầu flow OAuth với Microsoft
router.get("/microsoft", (req, res, next) => {
    console.log("Request đến /api/auth/microsoft");
    next();
  }, passport.authenticate("azuread-openidconnect"));

// Route callback với custom callback để xử lý lỗi và chuyển hướng theo flag needProfileUpdate
router.get("/microsoft/callback", (req, res, next) => {
    console.log("Query parameters in callback:", req.query);
  passport.authenticate("azuread-openidconnect", (err, user, info) => {
    if (err) {
        console.error("Lỗi từ Microsoft OAuth:", err);
        return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent("Lỗi từ Microsoft OAuth: " + err.message)}`);
      }
      if (!user) {
        console.error("Lỗi xác thực: Không tìm thấy user trong database hoặc authentication bị từ chối từ Microsoft.");
        
        if (info && info.message) {
          console.error("Chi tiết lỗi từ Passport:", info.message);
          return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent("Authentication failed: " + info.message)}`);
        } else {
          console.error("Không có thông tin cụ thể từ Passport.");
          return res.redirect(`http://localhost:3000/login?error=Authentication+failed:+User+not+found+or+denied+by+Microsoft`);
        }
      }
    try {
      // Tạo JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
      
      // Nếu user cần cập nhật thông tin (chưa hoàn tất hồ sơ)
      if (user.needProfileUpdate) {
        // Chuyển hướng đến trang hoàn tất hồ sơ (frontend)
        return res.redirect(`${frontendURL}/complete-profile?token=${token}`);
      } else {
        // Nếu không cần cập nhật, chuyển hướng tới trang thành công
        return res.redirect(`${frontendURL}/auth/microsoft/success?token=${token}`);
      }
    } catch (tokenError) {
      console.error("Lỗi khi tạo JWT:", tokenError);
      return res.redirect(`http://localhost:3000/login?error=${encodeURIComponent(tokenError.message)}`);
    }
  })(req, res, next);
});

module.exports = router;