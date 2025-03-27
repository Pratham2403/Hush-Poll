import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createPoll,
  getPolls,
  getPoll,
  getUserPolls,
  submitVote,
  getResults,
} from "../controllers/poll.controller.js";

const router = express.Router();

router.post("/", authenticate, createPoll);
router.get("/", getPolls);
router.get("/user", authenticate, getUserPolls);
router.get("/:id", getPoll);
router.post("/:id/vote", submitVote);
router.get("/:id/results", getResults);

export default router;
