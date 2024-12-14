const router = require("express").Router();
const postController = require("../controllers/post.controller");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const uploader = require("../config/cloudinary.config");

router.post("/", verifyAccessToken, postController.createPost);
router.get("/feed", verifyAccessToken, postController.getFeedPosts);

router.put(
  "/upload-files/:postId",
  [verifyAccessToken, uploader.fields([{ name: "filePosts", maxCount: 10 }])],
  postController.uploadFiles
);

router.put(
  "/like-unlike/:postId",
  verifyAccessToken,
  postController.likeUnlikePost
);

router.get(
  "/user-post/:userName",
  verifyAccessToken,
  postController.getUserPosts
);

router.put("/:postId", verifyAccessToken, postController.updatePost);
router.delete("/:postId", verifyAccessToken, postController.deletePost);
router.get("/:postId", verifyAccessToken, postController.getPost);

module.exports = router;
