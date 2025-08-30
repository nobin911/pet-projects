/** @format */

import express from "express";
import {
  getForgotPasswordToken,
  getProfile,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  verifyUser,
} from "../controllers/user.controller.js";
import isLoggedIn from "../middlewares/auth.middleware.js";
const userRoute = express.Router();

userRoute.post("/register", registerUser);
userRoute.get("/verify/:verificationToken", verifyUser);
userRoute.post("/login", loginUser);
userRoute.get("/profile", isLoggedIn, getProfile);
userRoute.post("/resetpassword", getForgotPasswordToken);
userRoute.patch("/reset-password/:token", resetPassword);
userRoute.get("/logout", isLoggedIn, logoutUser);

export default userRoute;
