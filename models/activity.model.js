const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var ativitySchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Types.ObjectId, ref: "User" },
    isSuerId: { type: mongoose.Types.ObjectId, ref: "User" },
    postId: { type: mongoose.Types.ObjectId, ref: "Post" },
    commentId: { type: mongoose.Types.ObjectId, ref: "Comment" },
    type: { type: String, enum: ["Like", "Comment", "Follow", "Like_Comment"] },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//Export the model
module.exports = mongoose.model("Activitie", ativitySchema);
