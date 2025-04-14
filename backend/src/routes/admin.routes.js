import express from "express";
import { authenticate, isAdmin } from "../middleware/auth.middleware.js";
import {
  getAllPolls,
  getAllUsers,
  deletePoll,
  getPollDetails,
  forceEndPoll,
  suspendUser,
} from "../controllers/admin.controller.js";
import { asyncHandler } from "../utils/errors.js";

const router = express.Router();

router.use(authenticate, isAdmin);

// Wrap all route handlers with asyncHandler to properly handle promise rejections
router.get("/users", asyncHandler(getAllUsers));
router.get("/polls", asyncHandler(getAllPolls));
router.get("/polls/:id", asyncHandler(getPollDetails));
router.post("/polls/:id/end", asyncHandler(forceEndPoll));
router.delete("/polls/:id", asyncHandler(deletePoll));
router.patch("/users/:id/suspend", asyncHandler(suspendUser));

export default router;
