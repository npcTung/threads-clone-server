const router = require("express").Router();
const conversationController = require("../controllers/conversation.controller");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.get(
  "/",
  [verifyAccessToken],
  conversationController.getAllConversations
);
router.get(
  "/:recipientId",
  [verifyAccessToken],
  conversationController.getConversation
);

module.exports = router;
