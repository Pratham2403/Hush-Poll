import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      logger.debug("No token provided in request");
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        logger.debug("User not found for token");
        req.user = null;
        return next();
      }

      // Check if user is suspended
      if (user.suspended) {
        logger.debug("User is suspended");
        return next(
          new ApiError(
            403,
            "Your account has been suspended. Please contact support for assistance."
          )
        );
      }

      logger.debug("User authenticated successfully", { userId: user._id });
      req.user = user;
      next();
    } catch (error) {
      logger.debug("JWT verification failed", { error: error.message });
      req.user = null;
      return next();
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    logger.error("Authentication error:", error);
    return next(new ApiError(401, "Authentication failed"));
  }
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }
  next();
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
