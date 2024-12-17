const jwt = require("jsonwebtoken");

module.exports = (uid, role, res) => {
  const data = {
    jti: Date.now().toString(),
    userId: uid,
    role: role,
    iss: process.env.VITE_API_KEY_STRINGEE,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const token = jwt.sign(data, process.env.VITE_API_SECRET_KEY_STRINGEE, {
    algorithm: "HS256",
  });

  res.cookie("accessToken", token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 7, // 7 days
    secure: process.env.NODE_ENV !== "development",
    sameSite: "none",
  });

  return token;
};
