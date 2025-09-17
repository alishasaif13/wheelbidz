import express from "express";
import dotenv from "dotenv";
import pool from "./config/db.js";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connect as connectSocketIOServer } from "./socket.js";
// import "./cronJob.js";
import "./config/passport.js";
import passport from "passport";

dotenv.config();
 
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(passport.initialize()); //initialize passport

 
// Verify DB connection
pool
  .query("SELECT 1")
  .then(() => console.log(" Database connection verified!"))
  .catch((err) => console.error(" Database connection failed:", err.message));
 
// Routes
app.get("/", (req, res) => {
  res.send("Server is running!");
});
 
import("./routes/memberRoutes.js")
  .then((module) => module.default(app))
  .catch((err) => console.error(" Failed to load memberRoutes:", err));
 
import("./routes/sellerRoutes.js")
  .then((module) => module.default(app))
  .catch((err) => console.error(" Failed to load sellerRoutes:", err));

import("./routes/adminRoutes.js")
  .then((module) => module.default(app))
  .catch((err) => console.error(" Failed to load adminRoutes:", err));
 
const server = http.createServer(app);
 
connectSocketIOServer(server);
 
server.listen(PORT, () => {
  console.log(` Server listening on port ${PORT}`);
});
 