const router = require("express").Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.put("/verify-otp", authController.verifyOTP);
router.get("/logout", authController.logout);
router.post("/login-google", authController.loginWithGoogle);
router.put("/forgot-password/:email", authController.forgotPassword);
router.put("/reset-password/:email", authController.resetPassword);
router.put("/send-otp/:email", authController.sendOtp);
router.get(
  "/verified-user/:userName",
  authController.checkVerifiedUserFromUserName
);
router.get("/has-user/:email", authController.checkNewUserFromEmail);

module.exports = router;
