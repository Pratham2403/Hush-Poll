import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      req.user = null;
      return next();
    }

    // Check if user is suspended
    if (user.suspended) {
      return next(
        new ApiError(
          403,
          "Your account has been suspended. Please contact support for assistance."
        )
      );
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      req.user = null;
      return next();
    }

    if (error instanceof ApiError) {
      return next(error);
    }

    logger.error("Authentication error:", error);
    return next(new ApiError(401, "Authentication failed"));
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.role !== "admin") {
    return next(new ApiError(403, "Admin access required"));
  }

  next();
};
