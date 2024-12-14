const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token)
    return res.status(401).json({
      success: false,
      mes: "You are not logged in! Please log in to get access.",
    });
  else {
    jwt.verify(token, process.env.SECRET_KEY, (err, decode) => {
      if (err)
        return res
          .status(401)
          .json({ success: false, mes: "Invalid access token" });

      req.user = decode;

      next();
    });
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  const { role } = req.user;

  if (+role !== "Admin")
    return res.status(401).json({ success: false, mes: "require admin role." });

  next();
});

module.exports = { verifyAccessToken, isAdmin };
