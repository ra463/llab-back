import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { SendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import getDataUri from "../utils/dataUri.js";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary";
import { AdminStats } from "../models/AdminStats.js";

export const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return next(new ErrorHandler("Please provide all the fields", 400));

  let user = await User.findOne({ email });

  if (user) return next(new ErrorHandler("User already exists", 409));

  const file = req.file;

  const fileUri = getDataUri(file);

  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendToken(res, user, "User registered successfully", 201);
});

export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please provide all the fields", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(new ErrorHandler("Invalid email or password", 401));

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password", 401));

  sendToken(res, user, `${user.name} logged in successfully`, 200);
});

export const logOutUser = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

export const getMyProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

export const deleteMyProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "User deleted successfully",
    });

  await user.remove();
});

export const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    return next(new ErrorHandler("Please provide all the fields", 400));

  const user = await User.findById(req.user._id).select("+password");

  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched)
    return next(new ErrorHandler("Old password is incorrect", 400));

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

export const changeMyProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (name) {
    user.name = name;
  }
  if (email) {
    user.email = email;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
  });
});

export const changeMyProfilePicture = catchAsyncErrors(
  async (req, res, next) => {
    const file = req.file;

    const user = await User.findById(req.user._id);

    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    user.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
    });
  }
);

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler("User not found", 404));

  const resetToken = await user.createResetToken();

  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. If you did not request this, please ignore this email and your password will remain unchanged. To reset your password, please click on the following link: \n\n ${url}`;

  await SendEmail(user.email, "Request to change your Password", message);

  res.status(200).json({
    success: true,
    message: `Email sent successfully to ${user.email}`,
  });
});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  const ResetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    ResetPasswordToken,
    ResetPasswordExpires: { $gt: Date.now() },
  });

  if (!user)
    return next(
      new ErrorHandler("Invalid token or token has been expired", 400)
    );

  user.password = req.body.password;

  user.ResetPasswordToken = undefined;
  user.ResetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: `Password changed successfully`,
  });
});

export const addToPlaylist = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  const course = await Course.findById(req.body.id);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  const alreadyAdded = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) {
      return true;
    }
  });

  if (alreadyAdded)
    return next(new ErrorHandler("Course already added to playlist", 409));

  user.playlist.push({ course: course._id, poster: course.poster.url });
  await user.save();
  res.status(200).json({
    success: true,
    message: `Added to playlist successfully`,
  });
});

export const removeFromPlaylist = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  const course = await Course.findById(req.body.id);

  if (!course) return next(new ErrorHandler("Course not found", 404));

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) {
      return item;
    }
  });

  user.playlist = newPlaylist;
  await user.save();
  res.status(200).json({
    success: true,
    message: `Removed from playlist successfully`,
  });
});

export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    success: true,
    users,
  });
});

export const updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  if (user.role === "user") user.role = "admin";
  else user.role = "user";

  await user.save();

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
  });
});

export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

User.watch().on("change", async () => {
  const data = await AdminStats.find({})
    .sort({
      createdAt: "desc",
    })
    .limit(1);

  const subscription = await User.find({
    "subscription.status": "active",
  });

  data[0].users = await User.countDocuments();
  data[0].subscriptions = subscription.length;
  data[0].createdAt = new Date(Date.now());

  await data[0].save();
});
