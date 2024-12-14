const ActivityLog = require("../models/activity-log.model");
const asyncHandler = require("express-async-handler");

const getAllActivityLogs = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const cursor = req.query.cursor || undefined;
  const pageSize = 20;

  const formatedQueries = { userId: id };

  if (cursor) formatedQueries._id = { $lt: cursor };

  const activityLog = await ActivityLog.find(formatedQueries)
    .populate([
      {
        path: "userId",
        select: "_id displayName",
      },
      {
        path: "postId",
        populate: {
          path: "postedBy",
          select: "displayName",
        },
      },
      { path: "commentId" },
    ])
    .sort({ createdAt: -1 })
    .limit(pageSize + 1)
    .exec();

  const nextCursor =
    activityLog.length > pageSize ? activityLog[pageSize]._id : null;

  res.status(activityLog.length > 0 ? 200 : 404).json({
    success: !!activityLog.length,
    mes: !activityLog.length
      ? "Không tìm thấy ghi nhật ký hoạt động."
      : undefined,
    data: activityLog.length ? activityLog.slice(0, pageSize) : undefined,
    nextCursor,
  });
});

module.exports = { getAllActivityLogs };
