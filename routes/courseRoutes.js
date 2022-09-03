import express from "express";
import {
  addLectureToCourse,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllCourses,
  getCourseLecture,
} from "../controllers/courseControllers.js";
import {
  isAdmin,
  isAuthenticated,
  subscribedUser,
} from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route("/courses").get(getAllCourses);

router
  .route("/createcourse")
  .post(isAuthenticated, isAdmin, upload, createCourse);

router
  .route("/course/:id")
  .get(isAuthenticated, subscribedUser, getCourseLecture)
  .post(isAuthenticated, isAdmin, upload, addLectureToCourse)
  .delete(isAuthenticated, isAdmin, deleteCourse);

router.route("/lecture").delete(isAuthenticated, isAdmin, deleteLecture);

export default router;
