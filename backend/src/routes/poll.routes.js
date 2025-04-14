import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
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
router.post("/", authenticate, asyncHandler(createPoll));
router.get("/", asyncHandler(getPolls));
router.get("/user", authenticate, asyncHandler(getUserPolls));
router.get(
  "/available-private",
  authenticate,
  asyncHandler(getAvailablePrivatePolls)
);
router.get("/:id", asyncHandler(getPoll));
router.post("/:id/vote", asyncHandler(submitVote));
router.get("/:id/results", asyncHandler(getResults));
router.delete("/:id", authenticate, asyncHandler(deletePoll));
router.put("/:id", authenticate, asyncHandler(updatePoll));

export default router;
