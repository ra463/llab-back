import express from "express";
import {
  buySubscription,
  cancelSubscription,
  getRazorPayKey,
  verifySubscription,
} from "../controllers/paymentControllers.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/subscribe").get(isAuthenticated, buySubscription);

router.route("/payment-verification").post(isAuthenticated, verifySubscription);

router.route("/razorpaykey").get(getRazorPayKey);

router.route("/subscribe/cancel").delete(isAuthenticated, cancelSubscription);

export default router;
