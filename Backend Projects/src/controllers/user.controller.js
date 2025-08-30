/** @format */

import User from "../model/User.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All the fields are required",
      });
    }
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User Already Exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "User register failed",
      });
    }
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    // sending mail

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDEREMAIL, // sender address
      to: user.email, // list of receivers
      subject: "verify your account", // Subject line
      text: `To verify click the following Link: ${process.env.BASE_URL}/api/v1/users/verify/${verificationToken}`,
      // html: "<b>Hello world?</b>", // html body
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "User is Created Succesfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error Creating User",
      error,
    });
  }
};

const verifyUser = async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    res.status(400).json({
      success: false,
      message: "Invalid Verification Token",
    });
  }

  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid Verification Token",
      });
    }

    user.isVarified = true;
    user.verificationToken = undefined;
    await user.save();
    res.status(201).json({
      success: true,
      message: "User Verified Successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "User Verification Failed",
      error,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ email, id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    const cookieOption = {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 1000 * 60 * 60 * 24,
    };
    res.cookie("jwt", token, cookieOption);

    res.status(201).json({
      success: true,
      message: "User Logged In Successfully",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "User Logged In Failed",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    // .select("-password -verificationToken -email");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User Not Found",
      });
    }

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Error Getting Profile",
      error,
    });
  }
};

const getForgotPasswordToken = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(401).json({
        success: false,
        message: "Email Required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid Email",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.forgotPasswordToken = token;
    user.forgotPasswordTokenExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    // console.log(user);

    // sending mail

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDEREMAIL, // sender address
      to: user.email, // list of receivers
      subject: "forgot password?", // Subject line
      text: `To reset password click the following Link: ${process.env.BASE_URL}/api/v1/users/reset-password/${token}`,
      // html: "<b>Hello world?</b>", // html body
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: "ForgetPasswordToken is Sent Successfully",
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "ForgotPasswordToken Sending Failed ",
    });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      forgotPasswordToken: token,
      forgotPasswordTokenExpires: { $gt: Date.now() }, // optional, if you're checking expiration
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = newPassword;
    user.forgotPasswordToken = null;
    user.forgotPasswordTokenExpires = null;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Password Reset Successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Password Reset Failed",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      expires: new Date(0),
    });

    res.status(201).json({
      success: true,
      message: "User Logged Out Successfully",
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "User Logged out Failed",
    });
  }
};

export {
  registerUser,
  verifyUser,
  loginUser,
  getProfile,
  logoutUser,
  getForgotPasswordToken,
  resetPassword,
};
