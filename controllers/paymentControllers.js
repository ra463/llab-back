import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/User.js";
import { Payment } from "../models/Payment.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { instance } from "../server.js";
import crypto from "crypto";

export const buySubscription = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.role === "admin")
    return next(new ErrorHandler("Admin cannot subscribe to a course", 400));

  const plan_id = process.env.PLAN_ID || "plan_KD4F3SkNabGDFZ";

  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });

  user.subscription.id = subscription.id;

  user.subscription.status = subscription.status;

  await user.save();

  res.status(200).json({
    success: true,
    subscriptionId: subscription.id,
  });
});

export const verifySubscription = catchAsyncErrors(async (req, res, next) => {
  const { razorpay_payment_id, razorpay_signatur, razorpay_subscription_id } =
    req.body;

  const user = await User.findById(req.user._id);

  const subscription_id = user.subscription.id;

  const generated_sign = crypto
    .createHmac("Sha256", process.env.RAZORPAY_API_KEY)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  const isAuthentic = generated_sign === razorpay_signatur;

  if (!isAuthentic)
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);

  // saving record in database for refund

  await Payment.create({
    razorpay_payment_id,
    razorpay_signatur,
    razorpay_subscription_id,
  });

  user.subscription.status = "active";

  await user.save();

  res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

export const getRazorPayKey = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_ID,
  });
});

export const cancelSubscription = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const subscriptionId = user.subscription.id;

  let refund = false;

  await instance.subscriptions.cancel(subscriptionId);

  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  const gap = Date.now() - payment.createdAt;

  const refundTime = process.env.REFUND_TIME * 24 * 60 * 60 * 1000;

  if (gap < refundTime) {
    await instance.payments.refund(payment.razorpay_payment_id);
    refund = true;
  }

  await payment.remove();
  user.subscription.id = undefined;
  user.subscription.status = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: refund
      ? "Subscription cancelled. You can get refund if you cancel within 7 days"
      : "Subscription cancelled. You cannot get refund now as you have crossed 7 days",
  });
});
