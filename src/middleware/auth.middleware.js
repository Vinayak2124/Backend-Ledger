const userModel = require("../models/user.model");

const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const isBlacklisted = await tokenBlacklistModel.findOne({ token: token });

  if (isBlacklisted) {
    return res
      .status(401)
      .json({ message: "Access denied. Token has been blacklisted." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized access. User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Unauthorized access. Invalid token." });
  }
}

async function systemAuthMiddleware(req, res, next) {
  const token = req.cookies.token || req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }
  const isBlacklisted = await tokenBlacklistModel.findOne({ token: token });
  if (isBlacklisted) {
    return res
      .status(401)
      .json({ message: "Access denied. Token has been blacklisted." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("+systemUser");
    if (!user.systemUser) {
      return res
        .status(403)
        .json({ message: "Unauthorized access. User is not a system user." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Unauthorized access. Invalid token." });
  }
}

module.exports = {
  authMiddleware,
  systemAuthMiddleware,
};
