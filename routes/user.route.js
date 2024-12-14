const router = require("express").Router();
const userController = require("../controllers/user.controller");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");

router.get("/current", verifyAccessToken, userController.getCurrent);
router.get("/", verifyAccessToken, userController.getUsers);
router.put("/", verifyAccessToken, userController.updateUser);

router.put(
  "/update-avatar",
  [verifyAccessToken, uploader.single("avatar")],
  userController.updateAvatar
);
router.put(
  "/follow-unfollow/:uid",
  verifyAccessToken,
  userController.followUnfollow
);
router.put(
  "/bookmark-unbookmark/:postId",
  verifyAccessToken,
  userController.bookmarkUnBookmark
);
router.put(
  "/block-account/:uid",
  verifyAccessToken,
  userController.blockAccount
);
router.get("/:userName", verifyAccessToken, userController.getUser);

module.exports = router;
