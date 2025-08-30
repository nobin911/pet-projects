/** @format */
import jwt from "jsonwebtoken";

const isLoggedIn = (req, res, next) => {
  const token = req.cookies?.jwt;
  //   const token=req.cookies.jwt || ""

  try {
    if (!token) {
      res.status(400).json({
        success: false,
        message: "Authentication Failed",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Please Log In",
    });
  }
  next();
};

export default isLoggedIn;
