const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var activityLogSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Types.ObjectId, ref: "Post" },
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    commentId: { type: mongoose.Types.ObjectId, ref: "Comment" },
    type: {
      type: String,
      enum: ["Like", "Comment", "Follow", "Like_Comment", "Post"],
    },
  },
  { timestamps: true }
);

//Export the model
module.exports = mongoose.model("ActivityLog", activityLogSchema);
