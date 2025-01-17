const User = require("../models/user.model");
const Activity = require("../models/activity.model");
const ActivityLog = require("../models/activity-log.model");
const filterObj = require("../lib/filterObj");
const asyncHandler = require("express-async-handler");
const cloudinary = require("cloudinary").v2;

const getCurrent = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const user = await User.findById(userId)
    .select("-verified -password -role -otp -otp_expiry_time")
    .populate([
      {
        path: "following",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "follower",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "blockedUsers",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
    ]);
  if (!user) throw new Error("Không tìm thấy người dùng.");

  return res.status(200).json({
    success: true,
    data: user,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const queries = { ...req.query };
  const { userId } = req.user;
  const cursor = queries.cursor || null;
  const pageSize = 10;
  let queryString = JSON.stringify(queries);
  queryString = queryString.replace(
    /\b(gte|gt|lt|lte)\b/g,
    (macthedEl) => `$${macthedEl}`
  );

  const user = await User.findById(userId);
  if (!user) throw new Error("Không tìm thấy người dùng.");

  const blockIds = user.blockedUsers
    ? [...user.blockedUsers, userId]
    : [userId];

  const formatedQueries = JSON.parse(queryString);
  delete formatedQueries.cursor;
  formatedQueries.verified = true;

  if (cursor)
    formatedQueries._id = {
      $lte: cursor,
      $nin: blockIds,
    };
  else formatedQueries._id = { $nin: blockIds };
  if (queries?.name)
    formatedQueries.name = { $regex: queries.name, $options: "i" };
  if (queries.q) {
    delete formatedQueries.q;
    formatedQueries["$or"] = [
      { userName: { $regex: req.query.q, $options: "i" } },
      { displayName: { $regex: req.query.q, $options: "i" } },
      { email: { $regex: req.query.q, $options: "i" } },
    ];
  }
  if (queries.recipients) {
    delete formatedQueries.recipients;
    formatedQueries._id = { $nin: queries.recipients };
  }

  try {
    const queryCommand = await User.find(formatedQueries)
      .select("-verified -password -role -otp -otp_expiry_time")
      .populate([
        {
          path: "following",
          select: "-verified -password -role -otp -otp_expiry_time",
        },
        {
          path: "follower",
          select: "-verified -password -role -otp -otp_expiry_time",
        },
      ])
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .exec();

    const nextCursor =
      queryCommand.length > pageSize ? queryCommand[pageSize]._id : null;

    return res.status(queryCommand.length > 0 ? 200 : 404).json({
      success: !!queryCommand.length,
      mes: !queryCommand.length ? "Không tìm thấy người dùng." : undefined,
      data: queryCommand.length ? queryCommand.slice(0, pageSize) : undefined,
      nextCursor,
    });
  } catch (err) {
    throw new Error(err.message);
  }
});

const getUser = asyncHandler(async (req, res) => {
  const { userName } = req.params;
  const { userId } = req.user;

  const user = await User.findOne({ userName })
    .select("-verified -password -role -otp -otp_expiry_time")
    .populate([
      {
        path: "following",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "follower",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
    ]);
  if (!user) throw new Error("Không tìm thấy người dùng.");

  const currentUser = await User.findById(userId);
  if (!currentUser) throw new Error("Không tìm thấy người dùng.");
  else if (
    currentUser.blockedUsers &&
    currentUser.blockedUsers.includes(user._id)
  )
    throw new Error("Người dùng bị chặn.");

  return res.status(200).json({
    success: true,
    data: user,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { displayName, bio } = req.body;

  if (!displayName) throw new Error("Yêu cầu không hợp lệ.");

  const maxLength = 200;
  if (bio && bio.length > maxLength) throw new Error("Yêu cầu không hợp lệ.");

  const filteredBody = filterObj(
    req.body,
    "displayName",
    "bio",
    "gender",
    "link"
  );

  const updateUser = await User.findByIdAndUpdate(userId, filteredBody, {
    new: true,
    validateModifiedOnly: true,
  }).populate([
    {
      path: "following",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
    {
      path: "follower",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
    {
      path: "blockedUsers",
      select: "-verified -password -role -otp -otp_expiry_time",
    },
  ]);

  return res.status(updateUser ? 200 : 400).json({
    success: !!updateUser,
    mes: updateUser
      ? "Người dùng đã cập nhật thành công."
      : "Không tìm thấy người dùng.",
    data: updateUser ? updateUser : undefined,
  });
});

const updateAvatar = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const avatarUrl = req.file.path;
  const filename = req.file.filename;

  if (!(avatarUrl && filename)) throw new Error("Avatar không hợp lệ.");

  const user = await User.findById(userId);
  if (!user) {
    cloudinary.uploader.destroy(filename);
    throw new Error("Không tìm thấy người dùng.");
  }

  const updateAvatar = await User.findByIdAndUpdate(
    id,
    { avatarUrl, filename },
    { new: true, validateModifiedOnly: true }
  );

  if (!updateAvatar) cloudinary.uploader.destroy(filename);
  else if (updateAvatar && user.avatarUrl && user.filename)
    cloudinary.uploader.destroy(user.filename);

  return res.status(updateAvatar ? 200 : 400).json({
    success: !!updateAvatar,
    mes: updateAvatar
      ? "Avatar đã được cập nhật thành công."
      : "Không tìm thấy người dùng.",
    data: updateAvatar ? updateAvatar : undefined,
  });
});

const followUnfollow = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const { userId } = req.user;

  const userToModify = await User.findById(uid);
  const currentUser = await User.findById(userId);

  if (userId === uid)
    throw new Error("Bạn không thể theo dõi/bỏ theo dõi chính mình.");

  if (!userToModify || !currentUser)
    throw new Error("Không tìm thấy người dùng.");

  const isFollowing = currentUser.following.includes(uid);

  if (isFollowing) {
    // unfollow
    await User.findByIdAndUpdate(uid, { $pull: { follower: userId } });
    const unfollow = await User.findByIdAndUpdate(
      userId,
      { $pull: { following: uid } },
      { new: true, validateModifiedOnly: true }
    );
    await Activity.deleteMany({
      isSuerId: currentUser._id,
      recipientId: userToModify._id,
      type: "Follow",
    });
    await ActivityLog.deleteMany({ userId, type: "Follow" });
    return res.status(200).json({
      success: true,
      mes: "Bỏ theo dõi người dùng thành công.",
      data: unfollow,
    });
  } else {
    // follow
    await User.findByIdAndUpdate(uid, { $push: { follower: userId } });
    const follow = await User.findByIdAndUpdate(
      userId,
      { $push: { following: uid } },
      { new: true, validateModifiedOnly: true }
    ).populate([
      {
        path: "following",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "follower",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "blockedUsers",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
    ]);
    await Activity.create({
      isSuerId: currentUser._id,
      recipientId: userToModify._id,
      type: "Follow",
    });
    await ActivityLog.create({ userId, type: "Follow" });
    return res.status(200).json({
      success: true,
      mes: "Theo dõi người dùng thành công.",
      data: follow,
    });
  }
});

const blockAccount = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const { userId } = req.user;

  const userToModify = await User.findById(uid);
  const currentUser = await User.findById(id);

  if (userId === uid) throw new Error("Bạn không thể chặn/bỏ chặn chính mình.");

  if (!userToModify || !currentUser)
    throw new Error("Không tìm thấy người dùng.");

  const isBlocked = currentUser.blockedUsers.includes(uid);

  if (isBlocked) {
    // unblock
    const unblock = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { blockedUsers: uid },
      },
      { new: true, validateModifiedOnly: true }
    ).populate([
      {
        path: "following",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "follower",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "blockedUsers",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
    ]);
    return res.status(200).json({
      success: true,
      mes: "Người dùng đã được bỏ chặn thành công.",
      data: unblock,
    });
  } else {
    // block
    const block = await User.findByIdAndUpdate(
      userId,
      {
        $push: { blockedUsers: uid },
      },
      { new: true, validateModifiedOnly: true }
    ).populate([
      {
        path: "following",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "follower",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "blockedUsers",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
    ]);
    if (currentUser.following.includes(uid)) {
      await User.findByIdAndUpdate(uid, { $pull: { follower: userId } });
      await User.findByIdAndUpdate(userId, { $pull: { following: uid } });
    }
    return res.status(200).json({
      success: true,
      mes: "Người dùng đã bị chặn thành công.",
      data: block,
    });
  }
});

const bookmarkUnBookmark = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.user;

  if (!postId) throw new Error("Mã bài đăng là bắt buộc.");

  const user = await User.findById(userId)
    .select("-verified -password -role -otp -otp_expiry_time")
    .populate([
      {
        path: "following",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
      {
        path: "follower",
        select: "-verified -password -role -otp -otp_expiry_time",
      },
    ]);
  if (!user)
    return res
      .status(404)
      .json({ success: false, mes: "Bài viết không tìm thấy." });

  const userBookmarked = user.bookmarkedPosts.includes(postId);

  if (userBookmarked) {
    // unbookmark
    const unbookmark = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { bookmarkedPosts: postId },
      },
      { new: true, validateModifiedOnly: true }
    )
      .select("-verified -password -role -otp -otp_expiry_time")
      .populate([
        {
          path: "following",
          select: "-verified -password -role -otp -otp_expiry_time",
        },
        {
          path: "follower",
          select: "-verified -password -role -otp -otp_expiry_time",
        },
      ]);
    res.status(200).json({
      success: true,
      mes: "Đã bỏ đánh dấu bài viết thành công.",
      data: unbookmark,
    });
  } else {
    // bookmark
    user.bookmarkedPosts.push(postId);
    const bookmark = await user.save({ new: true, validateModifiedOnly: true });
    return res.status(200).json({
      success: true,
      mes: "Đã đánh dấu bài viết thành công",
      data: bookmark,
    });
  }
});

module.exports = {
  getCurrent,
  getUsers,
  getUser,
  updateUser,
  updateAvatar,
  followUnfollow,
  blockAccount,
  bookmarkUnBookmark,
};
