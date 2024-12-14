const jwt = require("jsonwebtoken");

module.exports = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) next(new Error("Authentication error: Token is required."));

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Authentication error: " + error.message));
  }
};
