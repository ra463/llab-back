import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "../utils/ErrorHandler.js";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Login first to access this resource", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded._id);

  next();
});

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new ErrorHandler("Only admin can access this resource", 403));
  }
  next();
};

export const subscribedUser = (req, res, next) => {
  if (req.user.subscription.status !== "active" && req.user.role !== "admin") {
    return next(
      new ErrorHandler("Only subscribed users can access this resource", 403)
    );
  }

  next();
};
