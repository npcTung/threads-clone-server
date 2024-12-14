const User = require("../models/user.model");

module.exports = async (socket) => {
  const { id } = socket.user;

  await User.findByIdAndUpdate(
    id,
    {
      socketId: socket.id,
      status: "Online",
    },
    { new: true, validateModifiedOnly: true }
  );
};
