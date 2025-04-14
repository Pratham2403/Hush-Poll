import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/errors.js";

const router = express.Router();

// Wrap all route handlers with asyncHandler to properly handle promise rejections
router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/profile", authenticate, asyncHandler(getProfile));
router.put("/profile", authenticate, asyncHandler(updateProfile));
router.put("/password", authenticate, asyncHandler(changePassword));

export default router;
