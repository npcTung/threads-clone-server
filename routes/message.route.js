const router = require("express").Router();
const messageController = require("../controllers/message.controller");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const upload = require("../config/cloudinary.config");

router.post(
  "/media/:recipientId",
  [verifyAccessToken, upload.fields([{ name: "medias", maxCount: 10 }])],
  messageController.sendMessageMedias
);
router.post(
  "/audio/:recipientId",
  [verifyAccessToken, upload.single("audio")],
  messageController.sendMessageAudio
);
router.post(
  "/document/:recipientId",
  [verifyAccessToken, upload.single("document")],
  messageController.sendMessageDocument
);
router.post(
  "/giphy/:recipientId",
  [verifyAccessToken],
  messageController.sendGiphy
);
router.post(
  "/:recipientId",
  [verifyAccessToken],
  messageController.sendMessage
);
router.get(
  "/:conversationId",
  [verifyAccessToken],
  messageController.getAllMessages
);
router.put("/mark-as-read", [verifyAccessToken], messageController.markAsRead);

module.exports = router;
