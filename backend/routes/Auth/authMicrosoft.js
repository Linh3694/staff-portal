// backend/routes/authMicrosoft.js
const express = require("express");
const passport = require("passport");
const { OIDCStrategy } = require("passport-azure-ad");
const jwt = require("jsonwebtoken");
const User = require("../../models/Users");
const router = express.Router();

const azureConfig = require("../../config/azure");

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
  const redirectUri = req.query.redirectUri || "";
  const isMobile = req.query.mobile === "true";
  const isAdmission = req.query.admission === "true";

  // Lưu thông tin tùy chỉnh vào session
  req.session.authState = { redirectUri, isMobile, isAdmission };
  console.log("🔍 Nhận được request đến /microsoft với redirectUri:", redirectUri);
  passport.authenticate("azuread-openidconnect")(req, res, next);
});

router.get("/microsoft/callback", (req, res, next) => {

  let redirectUri = "";
  let isMobile = false;
  let isAdmission = false;

  // Lấy thông tin từ session (nếu có)
  if (req.session && req.session.authState) {
    redirectUri = req.session.authState.redirectUri;
    isMobile = req.session.authState.isMobile;
    isAdmission = req.session.authState.isAdmission;
    // Xóa sau khi đã lấy để không lộ thông tin lần sau
    delete req.session.authState;
  }

  passport.authenticate("azuread-openidconnect", (err, user, info) => {
    if (err) {
      console.error("❌ Lỗi từ Microsoft OAuth:", err);
      return res.redirect(`https://360wiser.wellspring.edu.vn/login?error=${encodeURIComponent(err.message)}`);
    }
    if (!user) {
      console.error("❌ Lỗi xác thực: Không tìm thấy user.");
      return res.redirect(`https://360wiser.wellspring.edu.vn/login?error=Authentication+failed`);
    }

    try {
      // 🔑 Tạo JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "365d" }
      );
      // Nếu đăng nhập từ mobile và có redirectUri thì chuyển về mobile
      if (isMobile && redirectUri) {
        return res.redirect(`${redirectUri}?token=${token}`);
      }

      // Nếu từ web, chuyển hướng về frontend
      const admissionQuery = isAdmission ? "&admission=true" : "";
      return res.redirect(`https://360wiser.wellspring.edu.vn/auth/microsoft/success?token=${token}${admissionQuery}`);
    } catch (error) {
      console.error("❌ Lỗi khi tạo JWT:", error);
      return res.redirect(`https://360wiser.wellspring.edu.vn/login?error=${encodeURIComponent(error.message)}`);
    }
  })(req, res, next);
});

module.exports = router;