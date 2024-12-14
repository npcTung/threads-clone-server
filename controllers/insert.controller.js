const User = require("../models/user.model");
const Post = require("../models/post.model");
const asyncHandler = require("express-async-handler");
const { dataUsers, dataPosts } = require("../data");

const fn1 = async (user) => {
  await User.create(user);
};

const insertUser = asyncHandler(async (req, res) => {
  const promises = [];
  for (let user of dataUsers) promises.push(fn1(user));
  await Promise.all(promises);
  return res.status(201).json({
    success: true,
    message: "Insert user successfully.",
  });
});

const fn2 = async (post) => {
  await Post.create(post);
};

const insertPost = asyncHandler(async (req, res) => {
  const promises = [];
  const postArr = [];
  const users = await User.find({ verified: true });
  for (let user of users) {
    for (let i = 0; i < 20; i++) {
      const post = { ...dataPosts[i % dataPosts.length] };
      post.postedBy = user._id;
      postArr.push(post);
    }
  }

  for (let post of postArr) promises.push(fn2(post));
  await Promise.all(promises);

  return res.status(200).json({
    success: true,
    mes: "Insert post successfully",
  });
});

module.exports = { insertUser, insertPost };
