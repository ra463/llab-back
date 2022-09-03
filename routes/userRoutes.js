import express from "express";
import {
  addToPlaylist,
  changeMyProfile,
  changeMyProfilePicture,
  changePassword,
  deleteMyProfile,
  deleteUser,
  forgotPassword,
  getAllUsers,
  getMyProfile,
  loginUser,
  logOutUser,
  registerUser,
  removeFromPlaylist,
  resetPassword,
  updateUserRole,
} from "../controllers/userControllers.js";
import { isAdmin, isAuthenticated } from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

router.route("/register").post(upload, registerUser);

router.route("/login").post(loginUser);

router.route("/logout").get(logOutUser);

router
  .route("/myprofile")
  .get(isAuthenticated, getMyProfile)
  .delete(isAuthenticated, deleteMyProfile);

router.route("/myprofile").get(isAuthenticated, getMyProfile);

router.route("/changepassword").put(isAuthenticated, changePassword);

router.route("/updateprofile").put(isAuthenticated, changeMyProfile);

router
  .route("/updatepicture")
  .put(upload, isAuthenticated, changeMyProfilePicture);

router.route("/forgotpassword").post(forgotPassword);

router.route("/resetpassword/:token").put(resetPassword);

router.route("/addtoplaylist").post(isAuthenticated, addToPlaylist);

router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

router.route("/admin/allusers").get(isAuthenticated, isAdmin, getAllUsers);

router
  .route("/admin/user/:id")
  .put(isAuthenticated, isAdmin, updateUserRole)
  .delete(isAuthenticated, isAdmin, deleteUser);

export default router;
