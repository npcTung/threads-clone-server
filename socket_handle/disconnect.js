const User = require("../models/user.model");

module.exports = async (socket) => {
  const { id } = socket.user;

  await User.findByIdAndUpdate(id, {
    status: "Offline",
    socketId: null,
    status_expiry_time: Date.now(),
  });
};
