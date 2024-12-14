const router = require("express").Router();
const ActivityController = require("../controllers/activity.controller");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.get("/", verifyAccessToken, ActivityController.getActivities);
router.get("/unread-count", verifyAccessToken, ActivityController.unreadCount);
router.put("/mark-as-read", verifyAccessToken, ActivityController.markAsRead);

module.exports = router;
