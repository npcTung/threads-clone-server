const Post = require("../models/post.model");
const User = require("../models/user.model");
const Comment = require("../models/comment.model");
const Activity = require("../models/activity.model");
const ActivityLog = require("../models/activity-log.model");
const asyncHandler = require("express-async-handler");
const cloudinary = require("cloudinary").v2;

const createPost = asyncHandler(async (req, res) => {
  const { postedBy, context } = req.body;
  const { id } = req.user;
  const postedByPopulate = [
    {
      path: "postedBy",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
  ];

  if (!postedBy) throw new Error("Người đăng là bắt buộc.");

  const user = await User.findById(postedBy);
  if (!user)
    res.status(404).json({ success: false, mes: "Không tìm thấy người dùng." });

  if (user._id.toString() !== id)
    res.status(401).json({
      success: false,
      mes: "Không được phép tạo bài đăng.",
    });

  const maxlength = 500;
  if (context && context.length > maxlength)
    throw new Error(`Nội dung phải ít hơn ${maxlength} ký tự.`);

  const newPost = await Post.create({ postedBy, context });

  let getPost;

  if (newPost) {
    getPost = await Post.findById(newPost._id).populate(postedByPopulate);
    await ActivityLog.create({ userId: id, postId: getPost._id, type: "Post" });
  }

  return res.status(newPost ? 200 : 500).json({
    success: newPost ? true : false,
    mes: newPost
      ? "Bài viết đã được tạo thành công."
      : "Không tạo được bài viết.",
    data: newPost ? getPost : undefined,
  });
});

const uploadFiles = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { id } = req.user;
  const postedByPopulate = [
    {
      path: "postedBy",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
  ];

  const post = await Post.findById(postId);
  if (!post) {
    cloudinary.api.delete_resources(
      req?.files?.filePosts?.map((filePost) => filePost.filename)
    );
    return res
      .status(404)
      .json({ success: false, mes: "Bài viết không tìm thấy." });
  }
  if (post.postedBy._id.toString() !== id) {
    cloudinary.api.delete_resources(
      req?.files?.filePosts?.map((filePost) => filePost.filename)
    );
    return res
      .status(404)
      .json({ success: false, mes: "Tài khoản không hợp lệ." });
  }

  if (req?.files) {
    const filenames = req.files.filePosts.map((filePost) => filePost.filename);
    const fileUrls = req.files.filePosts.map((filePost) => ({
      type: filePost.mimetype.split("/")[0].toUpperCase(),
      url: filePost.path,
    }));

    const uploadFilesPost = await Post.findByIdAndUpdate(
      postId,
      { fileUrls, filenames },
      {
        new: true,
        validateModifiedOnly: true,
      }
    ).populate(postedByPopulate);

    if (!uploadFilesPost) {
      cloudinary.api.delete_resources(
        req?.files?.filePosts?.map((filePost) => filePost.filename)
      );
      throw new Error("Không tải được tệp lên.");
    }
    if (uploadFilesPost && post.filenames && post.filenames.length) {
      cloudinary.api.delete_resources(post.filenames);
      cloudinary.api.delete_resources(post.filenames, {
        resource_type: "video",
      });
    }

    return res.status(200).json({
      success: true,
      mes: "Đã tải tập tin thành công.",
      data: uploadFilesPost,
    });
  } else
    return res.status(500).json({
      success: false,
      mes: "Yêu cầu chưa có tập tin.",
    });
});

const updatePost = asyncHandler(async (req, res) => {
  const { context } = req.body;
  const { postId } = req.params;
  const postedByPopulate = [
    {
      path: "postedBy",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
  ];

  if (!postId) throw new Error("Mã bài đăng là bắt buộc.");

  const post = await Post.findById(postId).populate(postedByPopulate);
  if (!post)
    return res
      .status(404)
      .json({ success: false, mes: "Bài viết không tìm thấy." });

  if (post.postedBy._id.toString() !== req.user.id)
    return res.status(401).json({
      success: false,
      mes: "Không được phép cập nhật bài viết.",
    });

  const maxlength = 500;
  if (context && context.length > maxlength)
    throw new Error(`Nội dung phải ít hơn ${maxlength} ký tự.`);

  post.context = context;
  const updatedPost = await post.save({
    new: true,
    validateModifiedOnly: true,
  });

  return res
    .status(200)
    .json({ success: true, mes: "Đã cập nhật bài đăng.", data: updatedPost });
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!postId) throw new Error("Mã bài đăng là bắt buộc.");

  const post = await Post.findById(postId);
  if (!post)
    return res
      .status(404)
      .json({ success: false, mes: "Bài viết không tìm thấy." });

  if (post.postedBy._id.toString() !== req.user.id)
    return res.status(401).json({
      success: false,
      mes: "Không được phép xóa bài viết.",
    });

  const deletedPost = await Post.findByIdAndDelete(postId);

  if (deletedPost) {
    await ActivityLog.deleteMany({
      postId: deletedPost._id,
      userId: deletedPost.postedBy,
    });
    await Comment.deleteMany({ postId: deletedPost._id });

    if (post.filenames && post.filenames.length) {
      cloudinary.api.delete_resources(post.filenames);
      cloudinary.api.delete_resources(post.filenames, {
        resource_type: "video",
      });
    }
  }

  return res.status(200).json({
    success: deletedPost ? true : false,
    mes: deletedPost ? "Đã xóa bài đăng." : undefined,
    data: deletedPost ? deletedPost : undefined,
  });
});

const likeUnlikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { id } = req.user;
  const postedByPopulate = [
    {
      path: "postedBy",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
  ];

  if (!postId) throw new Error("Mã bài đăng là bắt buộc.");

  const post = await Post.findById(postId).populate(postedByPopulate);
  if (!post)
    return res
      .status(404)
      .json({ success: false, mes: "Bài viết không tìm thấy." });

  const userLikedPost = post.likes.includes(id);

  if (userLikedPost) {
    // unlike
    const unlike = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: id } },
      { new: true, validateModifiedOnly: true }
    ).populate(postedByPopulate);
    if (unlike) {
      await User.findByIdAndUpdate(id, { $pull: { likedPosts: postId } });
      await Activity.deleteMany({
        isSuerId: id,
        recipientId: unlike.postedBy._id,
        postId,
        type: "Like",
      });
      await ActivityLog.deleteOne({
        postId: unlike._id,
        userId: id,
        type: "Like",
      });
    }
    return res.status(unlike ? 200 : 404).json({
      success: !!unlike,
      mes: unlike
        ? "Hủy like bài đăng thành công."
        : "Hủy like bài đăng thất bại.",
      data: unlike ? unlike : undefined,
    });
  } else {
    // like
    post.likes.push(id);
    const like = await post.save({ new: true, validateModifiedOnly: true });
    if (like) {
      await User.findByIdAndUpdate(id, { $push: { likedPosts: postId } });
      await ActivityLog.create({
        postId: like._id,
        userId: id,
        type: "Like",
      });
      if (like.postedBy._id.toString() !== id)
        await Activity.create({
          isSuerId: id,
          recipientId: like.postedBy._id,
          postId,
          type: "Like",
        });
    }
    return res.status(like ? 200 : 404).json({
      success: !!like,
      mes: like ? "Like bài đăng thành công." : "Like bài đăng thất bại.",
      data: like ? like : undefined,
    });
  }
});

const getFeedPosts = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const queries = { ...req.query };
  const cursor = queries.cursor || null;
  const pageSize = 10;
  const postedByPopulate = [
    {
      path: "postedBy",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
  ];

  const user = await User.findById(id);
  if (!user)
    return res
      .status(401)
      .json({ success: false, mes: "Không tìm thấy người dùng." });

  const objectQueries = { postedBy: { $nin: user.blockedUsers } };
  if (queries.follower) objectQueries.postedBy = { $in: user.following };
  else if (queries.likes) {
    if (cursor) objectQueries._id = { $in: user.likedPosts, $lte: cursor };
    else objectQueries._id = { $in: user.likedPosts };
  } else if (queries.bookmarks) {
    if (cursor) objectQueries._id = { $in: user.bookmarkedPosts, $lte: cursor };
    else objectQueries._id = { $in: user.bookmarkedPosts };
  } else if (cursor) objectQueries._id = { $lte: cursor };

  const posts = await Post.find(objectQueries)
    .populate(postedByPopulate)
    .sort({ createdAt: -1 })
    .limit(pageSize + 1)
    .exec();

  const dataPosts = [];
  for (let post of posts) {
    const totalCountComment = await Comment.countDocuments({
      postId: post._id,
    });
    dataPosts.push({ ...post._doc, totalCountComment });
  }

  const nextCursor = posts.length > pageSize ? posts[pageSize]._id : null;

  res.status(posts.length ? 200 : 404).json({
    success: posts.length ? true : false,
    mes: !posts.length ? "Bài viết không tìm thấy." : undefined,
    data: posts.length ? dataPosts.slice(0, pageSize) : undefined,
    nextCursor,
  });
});

const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const postedByPopulate = [
    {
      path: "postedBy",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
  ];

  const post = await Post.findById(postId).populate(postedByPopulate);

  const totalCountComment = await Comment.countDocuments({ postId });

  if (!post)
    return res
      .status(404)
      .json({ success: false, mes: "Bài viết không tìm thấy." });

  return res.status(200).json({
    success: true,
    data: { ...post._doc, totalCountComment },
  });
});

const getUserPosts = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  const { id } = req.user;
  const cursor = req.query.cursor || null;
  const pageSize = 10;
  const postedByPopulate = [
    {
      path: "postedBy",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
  ];

  const userToModify = await User.findOne({ userName: userName });
  const currentUser = await User.findById(id);
  if (!userToModify || !currentUser)
    return res.status(404).json({ error: "Không tìm thấy người dùng." });
  if (currentUser.blockedUsers.includes(userToModify._id))
    throw new Error("Người dùng nãy đã bị chặn.");
  const objectQueries = cursor ? { _id: { $lte: cursor } } : {};
  objectQueries.postedBy = userToModify._id;

  const posts = await Post.find(objectQueries)
    .populate(postedByPopulate)
    .sort({ createdAt: -1 })
    .limit(pageSize + 1)
    .exec();

  const dataPosts = [];
  for (let post of posts) {
    const totalCountComment = await Comment.countDocuments({
      postId: post._id,
    });
    dataPosts.push({ ...post._doc, totalCountComment });
  }

  const nextCursor = posts.length > pageSize ? posts[pageSize]._id : null;

  res.status(dataPosts.length ? 200 : 404).json({
    success: dataPosts.length ? true : false,
    mes: !dataPosts.length ? "Bài viết không tìm thấy." : undefined,
    data: dataPosts.length ? dataPosts.slice(0, pageSize) : undefined,
    nextCursor,
  });
});

module.exports = {
  createPost,
  uploadFiles,
  updatePost,
  deletePost,
  likeUnlikePost,
  getFeedPosts,
  getPost,
  getUserPosts,
};
