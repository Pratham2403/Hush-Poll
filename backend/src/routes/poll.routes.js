import express from "express";
import { authenticate, requireAuth } from "../middleware/auth.middleware.js";
import {
  createPoll,
  getPolls,
  getPoll,
  getUserPolls,
  submitVote,
  getResults,
  deletePoll,
  getAvailablePrivatePolls,
  updatePoll,
} from "../controllers/poll.controller.js";
import { asyncHandler } from "../utils/errors.js";

const router = express.Router();

// Wrap all route handlers with asyncHandler to properly handle promise rejections
router.post("/", authenticate, requireAuth, asyncHandler(createPoll));
router.get("/", asyncHandler(getPolls));
router.get("/user", authenticate, requireAuth, asyncHandler(getUserPolls));
router.get(
  "/available-private",
  authenticate,
  requireAuth,
  asyncHandler(getAvailablePrivatePolls)
);
router.get("/:id", authenticate, asyncHandler(getPoll));
router.post("/:id/vote", authenticate, requireAuth, asyncHandler(submitVote));
router.get("/:id/results", authenticate, asyncHandler(getResults));
router.delete("/:id", authenticate, requireAuth, asyncHandler(deletePoll));
router.put("/:id", authenticate, requireAuth, asyncHandler(updatePoll));

export default router;
