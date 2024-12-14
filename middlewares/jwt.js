const jwt = require("jsonwebtoken");

module.exports = (uid, role, res) => {
  const token = jwt.sign({ id: uid, role: role }, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });

  res.cookie("accessToken", token, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 7, // 7 days
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};
