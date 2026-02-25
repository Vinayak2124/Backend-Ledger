const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { sendRegistrationEmail } = require("../services/email.service");
const tokenBlacklistModel = require("../models/blacklist.model");
async function userRegisterController(req, res) {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res
      .status(400)
      .json({ message: "Email, name, and password are required" });
  }

  const isExists = await userModel.findOne({ email: email });

  if (isExists) {
    return res.status(422).json({
      message: "user already exists with email, please use a different email",
      status: "failed",
    });
  }
  const user = await userModel.create({
    email,
    name,
    password,
  });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  res.cookie("token", token, {
    httpOnly: true,
  });
  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      token: token,
    },
    message: "User registered successfully",
    status: "success",
  });

  await sendRegistrationEmail(user.email, user.name);
}

async function userLoginController(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = await userModel.findOne({ email: email }).select("+password");
  if (!user) {
    return res.status(401).json({
      message: "user not found with this email, please register first",
      status: "failed",
    });
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res
      .status(401)
      .json({ message: "Invalid email or password", status: "failed" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  res.cookie("token", token, {
    httpOnly: true,
  });
  return res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      token: token,
    },
    message: "User logged in successfully",
    status: "success",
  });
}

async function logoutController(req, res) {
  const token = req.cookies.token || req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res
      .status(400)
      .json({ message: "Already logged out or no token provided" });
  }

  res.clearCookie("token");
  await tokenBlacklistModel.create({ token: token });
  return res
    .status(200)
    .json({ message: "User Logged out successfully", status: "success" });
}
module.exports = {
  userRegisterController,
  userLoginController,
  logoutController,
};
