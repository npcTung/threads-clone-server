const authRouter = require("./auth.route");
const userRouter = require("./user.route");
const insertRouter = require("./insert.route");
const postRouter = require("./post.route");
const activityRouter = require("./activity.route");
const commentRouter = require("./comment.route");
const conversationRouter = require("./conversation.route");
const messageRouter = require("./message.route");
const activityLogRouter = require("./activity-log.route");
const { errHandler, notFound } = require("../lib/errorHandel");

module.exports = (app) => {
  app.use("/api/auth", authRouter);
  app.use("/api/user", userRouter);
  app.use("/api/insert", insertRouter);
  app.use("/api/insert", insertRouter);
  app.use("/api/post", postRouter);
  app.use("/api/activity", activityRouter);
  app.use("/api/comment", commentRouter);
  app.use("/api/conversation", conversationRouter);
  app.use("/api/message", messageRouter);
  app.use("/api/activity-log", activityLogRouter);

  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      mes: "init router",
    });
  });

  app.use(notFound);
  app.use(errHandler);
};
