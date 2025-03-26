const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const {
  createPoll,
  getPolls,
  getPoll,
  getUserPolls,
  submitVote,
  getResults,
} = require("../controllers/poll.controller");

router.post("/", authenticate, createPoll);
router.get("/", getPolls);
router.get("/user", authenticate, getUserPolls);
router.get("/:id", getPoll);
router.post("/:id/vote", submitVote);
router.get("/:id/results", getResults);

module.exports = router;
