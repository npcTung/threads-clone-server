const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcryptjs");

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, "User Name is required"],
      validate: {
        validator: function (userName) {
          return String(userName)
            .toLowerCase()
            .match(/^[a-zA-Z0-9_]+$/);
        },
        message: (props) => `Username (${props.value}) is invalid!`,
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: {
        validator: function (email) {
          return String(email)
            .toLowerCase()
            .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
        },
        message: (props) => `Email (${props.value}) is invalid!`,
      },
    },
    displayName: {
      type: String,
      required: [true, "Display Name is required"],
    },
    likedPosts: [{ type: mongoose.Types.ObjectId, ref: "Post" }],
    bookmarkedPosts: [{ type: mongoose.Types.ObjectId, ref: "Post" }],
    password: String,
    avatarUrl: String,
    filename: String,
    bio: String,
    link: String,
    gender: { type: String, enum: ["male", "female"] },
    following: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    follower: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    otp: String,
    otp_expiry_time: Date,
    verified: { type: Boolean, default: false },
    status: { type: String, enum: ["Online", "Offline"] },
    role: { type: String, enum: ["Admin", "User"], default: "User" },
    blockedUsers: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["Online", "Offline"], default: "Offline" },
    status_expiry_time: Date,
    socketId: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = bcrypt.genSaltSync(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("otp") || !this.otp) return next();

  if (this.isModified("otp")) {
    const salt = bcrypt.genSaltSync(12);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
});

userSchema.methods = {
  isCorrectPassword: async function (password) {
    return await bcrypt.compare(password, this.password);
  },
  isCorrectOTP: async function (otp) {
    return await bcrypt.compare(otp, this.otp);
  },
};

//Export the model
module.exports = mongoose.model("User", userSchema);
