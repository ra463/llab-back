import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { AdminStats } from "../models/AdminStats.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { SendEmail } from "../utils/sendEmail.js";

export const contactUs = catchAsyncErrors(async (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message)
    return next(new ErrorHandler("Please fill all fields", 400));

  const to = process.env.EMAIL_TO;
  const subject = `Contact Us from Learning Lab`;
  const text = `My Name is: ${name} and Email is: ${email} \n\nMessage: ${message}`;

  await SendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Message sent successfully",
  });
});

export const requestCourse = catchAsyncErrors(async (req, res, next) => {
  const { name, email, course } = req.body;

  if (!name || !email || !course)
    return next(new ErrorHandler("Please fill all fields", 400));

  const to = process.env.EMAIL_TO;
  const subject = `Request Course from Learning Lab`;
  const text = `My Name is: ${name} and Email is: ${email} \n\n Requested Course: ${course}`;

  await SendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Message sent successfully",
  });
});

export const getAdminInfo = catchAsyncErrors(async (req, res, next) => {
  const adminInfo = await AdminStats.find({})
    .sort({
      createdAt: "desc",
    })
    .limit(12);

  const adminData = [];

  for (let i = 0; i < adminInfo.length; i++) {
    adminData.unshift(adminInfo[i]);
  }

  const requiredSize = 12 - adminInfo.length;

  for (let i = 0; i < requiredSize; i++) {
    adminData.unshift({
      users: 0,
      subscriptions: 0,
      views: 0,
    });
  }

  const numOfuser = adminData[11].users;
  const numOfSubscription = adminData[11].subscriptions;
  const numOfViews = adminData[11].views;

  let userProfit = true,
    subscriptionProfit = true,
    viewsProfit = true;

  let userPercentage = 0,
    subscriptionPercentage = 0,
    viewsPercentage = 0;

  if (adminData[10].users === 0) userPercentage = numOfuser * 100;
  if (adminData[10].views === 0) viewsPercentage = numOfViews * 100;
  if (adminData[10].subscriptions === 0)
    subscriptionPercentage = numOfSubscription * 100;
  else {
    const difference = {
      users: adminData[11].users - adminData[10].users,
      views: adminData[11].views - adminData[10].views,
      subscriptions: adminData[11].subscriptions - adminData[10].subscriptions,
    };

    userPercentage = (difference.users / adminData[10].users) * 100;
    viewsPercentage = (difference.views / adminData[10].views) * 100;
    subscriptionPercentage =
      (difference.subscriptions / adminData[10].subscriptions) * 100;

    if (userPercentage < 0) userProfit = false;
    if (viewsPercentage < 0) viewsProfit = false;
    if (subscriptionPercentage < 0) subscriptionProfit = false;
  }

  res.status(200).json({
    success: true,
    stats: adminData,
    numOfuser,
    numOfSubscription,
    numOfViews,
    subscriptionPercentage,
    userPercentage,
    viewsPercentage,
    userProfit,
    viewsProfit,
    subscriptionProfit,
  });
});
