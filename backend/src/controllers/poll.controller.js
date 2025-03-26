const Poll = require("../models/poll.model");
const Vote = require("../models/vote.model");
const { generateInviteCode, encryptData } = require("../utils/crypto");
const { ApiError } = require("../utils/errors");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

exports.createPoll = async (req, res) => {
  try {
    const { question, options, type, expiration, isPublic } = req.body;

    const poll = new Poll({
      creator: req.user?._id,
      question,
      options,
      type,
      expiration: new Date(expiration),
      isPublic,
    });

    if (!isPublic) {
      poll.inviteCodes = [generateInviteCode()];
    }

    await poll.save();

    // Emit socket event for real-time updates
    req.app.get("io").emit("pollCreated", { pollId: poll._id });

    res.status(201).json(poll);
  } catch (error) {
    logger.error("Error creating poll:", error);
    throw new ApiError(400, "Failed to create poll");
  }
};

exports.getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    if (!poll.isPublic && !poll.inviteCodes.includes(req.query.inviteCode)) {
      throw new ApiError(403, "Invalid invite code");
    }

    res.json(poll);
  } catch (error) {
    logger.error("Error fetching poll:", error);
    throw new ApiError(400, "Failed to fetch poll");
  }
};

exports.submitVote = async (req, res) => {
  try {
    const { selectedOptions, voterToken } = req.body;
    const pollId = req.params.id;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    if (new Date() > poll.expiration) {
      throw new ApiError(400, "Poll has expired");
    }

    // Encrypt voter token for privacy
    const encryptedToken = encryptData(voterToken);

    const vote = new Vote({
      pollId,
      selectedOptions,
      voterToken: encryptedToken,
    });

    await vote.save();

    // Emit socket event for real-time updates
    const results = await this.calculateResults(pollId);
    req.app.get("io").to(pollId).emit("voteUpdate", results);

    res.status(201).json({ message: "Vote recorded successfully" });
  } catch (error) {
    logger.error("Error submitting vote:", error);
    throw new ApiError(400, "Failed to submit vote");
  }
};

exports.getResults = async (req, res) => {
  try {
    const results = await Vote.aggregate([
      { $match: { pollId: new mongoose.Types.ObjectId(req.params.id) } },
      { $unwind: "$selectedOptions" },
      {
        $group: {
          _id: "$selectedOptions",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(results);
  } catch (error) {
    logger.error("Error fetching results:", error);
    throw new ApiError(400, "Failed to fetch results");
  }
};

exports.getPolls = async (req, res) => {
  try {
    // Get all public polls, sorted by creation date (newest first)
    const polls = await Poll.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("creator", "name");

    res.json(polls);
  } catch (error) {
    logger.error("Error fetching polls:", error);
    throw new ApiError(400, "Failed to fetch polls");
  }
};

exports.getUserPolls = async (req, res) => {
  try {
    // Get polls created by the authenticated user
    const polls = await Poll.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .populate("creator", "name");

    res.json(polls);
  } catch (error) {
    logger.error("Error fetching user polls:", error);
    throw new ApiError(400, "Failed to fetch your polls");
  }
};
