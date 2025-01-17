const router = require("express").Router();
const messageController = require("../controllers/message.controller");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const upload = require("../config/cloudinary.config");

router.post("/", [verifyAccessToken], messageController.sendMessage);
router.post(
  "/media",
  [verifyAccessToken, upload.fields([{ name: "medias", maxCount: 10 }])],
  messageController.sendMessageMedias
);
router.post(
  "/audio",
  [verifyAccessToken, upload.single("audio")],
  messageController.sendMessageAudio
);
router.post(
  "/document",
  [verifyAccessToken, upload.single("document")],
  messageController.sendMessageDocument
);
router.post("/giphy", [verifyAccessToken], messageController.sendGiphy);
router.get(
  "/:conversationId",
  [verifyAccessToken],
  messageController.getAllMessages
);
router.put("/mark-as-read", [verifyAccessToken], messageController.markAsRead);

module.exports = router;
