import express from "express";
import {
  contactUs,
  getAdminInfo,
  requestCourse,
} from "../controllers/otherControllers.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/contact").post(contactUs);

router.route("/requestcourse").post(requestCourse);

router.route("/admin/info").get(isAuthenticated, getAdminInfo);

export default router;
