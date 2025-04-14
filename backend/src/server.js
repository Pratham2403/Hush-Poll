import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import authRoutes from "./routes/auth.routes.js";
import pollRoutes from "./routes/poll.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import initSocket from "./socket.js";
import logger from "./utils/logger.js";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use(errorHandler);

// Initialize WebSocket server
const io = new Server(server, {
  cors: corsOptions,
});

initSocket(io);

// Store io instance on app for access in routes
app.set("io", io);

// Connection to MongoDB
export const initializeServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("Connected to MongoDB");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);

      // Log WebSocket initialization status
      const socketInstance = app.get("io");
      if (socketInstance) {
        logger.info("WebSocket (Socket.IO) server is available and ready");
      } else {
        logger.warn("WebSocket server not properly initialized");
      }
    });
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Start the server - ESM doesn't have the same require.main check as CommonJS
// so we just initialize the server directly in this file
initializeServer();

export default app;
