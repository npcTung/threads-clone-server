const router = require("express").Router();
const activityLogController = require("../controllers/activity-log.controller");
const { verifyAccessToken } = require("../middlewares/verifyToken");

router.get("/", [verifyAccessToken], activityLogController.getAllActivityLogs);

module.exports = router;
