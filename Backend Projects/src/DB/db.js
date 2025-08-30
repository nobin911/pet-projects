/** @format */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log("MongoDB Connection Failed ", error);
  }
};

export default dbConnection;
