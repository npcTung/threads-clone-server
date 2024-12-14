const User = require("../models/user.model");
const asyncHandler = require("express-async-handler");
const otpGenerator = require("otp-generator");
const sendMail = require("../lib/sendMail");
const htmlOtp = require("../templates/sendOtp");
const filterObj = require("../lib/filterObj");
const generateAccessToken = require("../middlewares/jwt");

const sendOtpEmail = asyncHandler(async (email) => {
  const new_otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  const otp_expiry_time = Date.now() + 10 * 60 * 1000; // 10 Mins after otp is sent

  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found.");

  user.otp = new_otp;
  user.otp_expiry_time = otp_expiry_time;

  await user.save({ new: true, validateModifiedOnly: true });

  await sendMail({
    email: user.email,
    html: htmlOtp({ user: user.displayName, otp: new_otp }),
    subject: "Threads: Verify your email.",
  });
});

const register = asyncHandler(async (req, res) => {
  const { userName, displayName, email, password } = req.body;
  if (!(userName && displayName && email && password))
    throw new Error("Invalid request.");

  const filteredBody = filterObj(
    req.body,
    "userName",
    "displayName",
    "email",
    "password"
  );

  const userName_exit = await User.findOne({ userName });
  if (userName_exit) throw new Error("Tên người dùng đã tồn tại.");
  const email_exit = await User.findOne({ email });
  if (email_exit && email_exit.verified)
    throw new Error("Email đã được sử dụng, vui lòng đăng nhập.");
  else if (email_exit) {
    const new_user = await User.findOneAndUpdate({ email }, filteredBody, {
      new: true,
      validateModifiedOnly: true,
    });

    if (new_user) await sendOtpEmail(new_user.email);

    return res.status(new_user ? 200 : 500).json({
      success: !!new_user,
      mes: new_user
        ? "Người dùng đã đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản của bạn."
        : "Không thể đăng ký người dùng.",
    });
  } else {
    const new_user = await User.create(filteredBody);
    if (new_user) await sendOtpEmail(new_user.email);

    return res.status(new_user ? 200 : 500).json({
      success: !!new_user,
      mes: new_user
        ? "Người dùng đã đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản của bạn."
        : "Không thể đăng ký người dùng.",
    });
  }
});

const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const user = await User.findOne({ email });
  if (!user) throw new Error("Không tìm thấy người dùng.");

  await sendOtpEmail(user.email);

  return res.status(200).json({
    success: true,
    mes: "Mã OTP đã được gửi tới email của bạn.",
  });
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new Error("Yêu cầu không hợp lệ.");

  const user = await User.findOne({
    email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) throw new Error("Email không hợp lệ hoặc OTP đã hết hạn.");
  if (user.verified) throw new Error("Email đã được xác minh.");
  if (!(await user.isCorrectOTP(otp))) throw new Error("OTP không đúng.");

  user.verified = true;
  user.otp = null;
  user.otp_expiry_time = undefined;
  await user.save();

  const token = generateAccessToken(user._id, user.role, res);

  return res.status(200).json({
    success: true,
    mes: "Email đã được xác minh thành công.",
    token,
  });
});

const login = asyncHandler(async (req, res) => {
  const { userName, password } = req.body;
  if (!(userName || password)) throw new Error("Yêu cầu không hợp lệ.");

  const user = await User.findOne({ userName }).select("+password");

  if (!user) throw new Error("Không tìm thấy người dùng.");
  if (!user.verified)
    throw new Error(
      "Email chưa được xác minh. Vui lòng xác minh email trước khi đăng nhập."
    );
  if (!user.password) throw new Error("Mật khẩu không đúng.");
  if (!(await user.isCorrectPassword(password)))
    throw new Error("Email hoặc mật khẩu không đúng.");

  const token = generateAccessToken(user._id, user.role, res);

  return res.status(200).json({
    success: true,
    mes: "Đã đăng nhập thành công.",
    token,
  });
});

const loginWithGoogle = asyncHandler(async (req, res) => {
  const { userName, displayName, email, avatarUrl, password, verified } =
    req.body;

  const email_exit = await User.findOne({ email });
  if (!email_exit) {
    const userName_exit = await User.findOne({ userName });
    if (userName_exit) throw new Error("Tên người dùng đã tồn tại.");

    const new_user = await User.create({
      email,
      userName,
      displayName,
      avatarUrl,
      password,
      verified,
    });

    if (!new_user) throw new Error("Không thể đăng ký người dùng.");
    const token = generateAccessToken(new_user._id, new_user.role, res);

    return res.status(new_user ? 200 : 500).json({
      success: !!new_user,
      mes: new_user
        ? "Đăng nhập bằng google thành công."
        : "Đăng nhập thất bại.",
      token,
    });
  }
});

const checkNewUserFromEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;
  let token;

  const user = await User.findOne({ email });
  if (user) token = generateAccessToken(user._id, user.role, res);
  return res.json({ success: true, hasUser: !!user, token });
});

const checkVerifiedUserFromUserName = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  const user = await User.findOne({ userName });
  if (!user) throw new Error("Không tìm thấy người dùng.");
  return res.json({
    success: true,
    isVerified: user.verified,
    email: user ? user.email : undefined,
  });
});

const logout = asyncHandler(async (req, res) => {
  const { accessToken } = req.cookies;

  if (!accessToken) throw new Error("Không tìm thấy cookies.");

  res.clearCookie("accessToken", { httpOnly: true, secure: true });
  return res.status(200).json({
    success: true,
    mes: "Đã đăng xuất thành công.",
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const user = await User.findOne({ email });
  if (!user) throw new Error("Không tìm thấy người dùng.");

  await sendOtpEmail(user.email);

  return res.status(200).json({
    success: true,
    mes: "OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email của bạn để đặt lại mật khẩu.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { otp, password } = req.body;
  if (!(otp || password)) throw new Error("Yêu cầu không hợp lệ.");

  const user = await User.findOne({
    email,
    otp_expiry_time: { $gt: Date.now() },
  });

  if (!user) throw new Error("Email không hợp lệ hoặc OTP đã hết hạn.");
  if (await user.isCorrectPassword(password))
    throw new Error("Mật khẩu cũ và mới không được giống nhau.");
  if (!(await user.isCorrectOTP(otp))) throw new Error("OTP không đúng.");

  user.password = password;
  user.verified = true;
  user.otp = null;
  user.otp_expiry_time = undefined;
  await user.save();

  return res.status(200).json({
    success: true,
    mes: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới của bạn.",
  });
});

module.exports = {
  register,
  sendOtp,
  login,
  logout,
  verifyOTP,
  forgotPassword,
  resetPassword,
  checkNewUserFromEmail,
  loginWithGoogle,
  checkVerifiedUserFromUserName,
};
