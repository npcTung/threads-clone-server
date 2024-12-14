const Comment = require("../models/comment.model");
const Post = require("../models/post.model");
const User = require("../models/user.model");
const Activity = require("../models/activity.model");
const ActivityLog = require("../models/activity-log.model");
const asyncHandler = require("express-async-handler");

const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { context } = req.body;
  const { id } = req.user;
  const userPopulate = [
    {
      path: "userId",
      select:
        "-verified -password -role -otp -otp_expiry_time -filename -updatedAt",
    },
  ];

  const user = await User.findById(id);
  if (!user)
    return res
      .status(401)
      .json({ success: false, mes: "Không tìm thấy người dùng." });

  if (!context) throw new Error("Cần phải có ngữ cảnh.");

  const post = await Post.findById(postId);
  if (!post)
    return res
      .status(404)
      .json({ success: false, mes: "Bài viết không tìm thấy." });

  const comment = await Comment.create({
    context,
    postId,
    userId: user._id,
  });

  if (comment) {
    const commented = await Comment.findById(comment._id).populate(
      userPopulate
    );
    await ActivityLog.create({
      userId: id,
      postId: postId,
      commentId: commented._id,
      type: "Comment",
    });
    if (post.postedBy.toString() !== id)
      await Activity.create({
        isSuerId: user._id,
        recipientId: post.postedBy,
        postId,
        commentId: commented._id,
        type: "Comment",
      });

    return res.status(200).json({
      success: true,
      mes: "Tạo bình luận thành công.",
      data: commented,
    });
  } else
    return res
      .status(500)
      .json({ success: false, mes: "Tạo bình luận thất bại." });
});

const getAllComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { id } = req.user;
  const cursor = req.query.cursor || null;
  const pageSize = 10;
  const userPopulate = [
    {
      path: "userId",
      select:
        "-verified -password -role -otp -otp_expiry_time -filename -updatedAt",
    },
  ];

  const user = await User.findById(id);
  if (!user)
    return res
      .status(401)
      .json({ success: false, mes: "Không tìm thấy người dùng." });

  const post = await Post.findById(postId);
  if (!post)
    return res
      .status(404)
      .json({ success: false, mes: "Bài viết không tìm thấy." });

  const objectQueries = { postId };
  if (cursor) objectQueries._id = { $lte: cursor };

  const comments = await Comment.find(objectQueries)
    .populate(userPopulate)
    .sort({ createdAt: -1 })
    .limit(pageSize + 1)
    .exec();

  const nextCursor = comments.length > pageSize ? comments[pageSize]._id : null;

  return res.status(comments.length ? 200 : 404).json({
    success: !!comments.length,
    mes: !comments.length ? "Không tìm thấy bình luận." : undefined,
    data: comments.length ? comments.slice(0, pageSize) : undefined,
    nextCursor,
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const { id } = req.user;

  const user = await User.findById(id);
  if (!user)
    return res
      .status(401)
      .json({ success: false, mes: "Không tìm thấy người dùng." });

  const deletedComment = await Comment.findByIdAndDelete(cid);

  if (deletedComment) {
    await Activity.deleteMany({
      commentId: cid,
      isSuerId: user._id,
      recipientId: deletedComment.userId._id,
      postId: deletedComment.postId,
    });
    await ActivityLog.deleteMany({
      commentId: cid,
      userId: id,
      postId: deletedComment.postId,
      type: "Comment",
    });
  }

  return res.status(deletedComment ? 200 : 404).json({
    success: !!deletedComment,
    mes: deletedComment
      ? "Xóa bình luận thành công."
      : "Xóa bình luận thất bại.",
    data: deletedComment ? deletedComment : undefined,
  });
});

const likeUnlikeComment = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  const { id } = req.user;

  const userPopulate = [
    {
      path: "userId",
      select:
        "-verified -password -role -otp -otp_expiry_time -filename -updatedAt",
    },
  ];

  const user = await User.findById(id);

  if (!user)
    return res
      .status(401)
      .json({ success: false, mes: "Không tìm thấy người dùng." });

  const comment = await Comment.findById(cid);
  if (!comment)
    return res
      .status(404)
      .json({ success: false, mes: "Không tìm thấy bình luận." });

  const isLiked = comment.likes.includes(id);

  if (isLiked) {
    // unlike
    const unlike = await Comment.findByIdAndUpdate(
      cid,
      { $pull: { likes: id } },
      { new: true, validateModifiedOnly: true }
    ).populate(userPopulate);
    if (unlike) {
      await Activity.deleteOne({
        commentId: cid,
        isSuerId: user._id,
        recipientId: unlike.userId._id,
        postId: unlike.postId,
        type: "Like_Comment",
      });
      await ActivityLog.deleteOne({
        commentId: cid,
        userId: id,
        postId: unlike.postId,
        type: "Like_Comment",
      });
    }

    return res.status(200).json({
      success: true,
      data: unlike,
    });
  } else {
    // like
    const like = await Comment.findByIdAndUpdate(
      cid,
      { $push: { likes: id } },
      { new: true, validateModifiedOnly: true }
    ).populate(userPopulate);
    if (like) {
      await ActivityLog.create({
        userId: id,
        postId: like.postId,
        commentId: cid,
        type: "Like_Comment",
      });
      if (like.userId._id.toString() !== id)
        await Activity.create({
          isSuerId: user._id,
          recipientId: like.userId._id,
          postId: like.postId,
          commentId: like._id,
          type: "Like_Comment",
        });
    }

    return res.status(200).json({
      success: true,
      data: like,
    });
  }
});

module.exports = {
  createComment,
  getAllComments,
  deleteComment,
  likeUnlikeComment,
};
