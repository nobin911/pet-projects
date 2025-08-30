/** @format */

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import dbConnection from "./src/DB/db.js";

//importing custom routes
import userRoute from "./src/routes/user.routes.js";

const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.BASE_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// console.log(process);
const port = process.env.PORT || 4000;
app.get("/", (req, res) => {
  res.send("Ready to fly");
});

//Database connection
dbConnection();

// routes
app.use("/api/v1/users", userRoute);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
