const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Types.ObjectId,
      ref: "Post",
      required: [true, "Post id comment is required."],
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "User id commnet is required."],
    },
    context: {
      type: String,
      required: [true, "Context comment is required."],
    },
    likes: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

//Export the model
module.exports = mongoose.model("Comment", commentSchema);
