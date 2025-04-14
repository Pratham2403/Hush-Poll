import User from "../models/user.model.js";
import Poll from "../models/poll.model.js";
import Vote from "../models/vote.model.js";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

export const getAllUsers = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Admin access required");
    }

    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    logger.error("Admin error fetching users:", error);
    throw new ApiError(400, "Failed to fetch users");
  }
};

export const getAllPolls = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Admin access required");
    }

    const polls = await Poll.find()
      .populate("creator", "name email")
      .sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    logger.error("Admin error fetching polls:", error);
    throw new ApiError(400, "Failed to fetch polls");
  }
};

export const getPollDetails = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Admin access required");
    }

    const pollId = req.params.id;
    const poll = await Poll.findById(pollId).populate("creator", "name email");

    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    // Get vote count
    const voteCount = await Vote.countDocuments({ pollId });

    // Get results
    const results = await Vote.aggregate([
      { $match: { pollId: poll._id } },
      { $unwind: "$selectedOptions" },
      {
        $group: {
          _id: "$selectedOptions",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format poll data with vote information
    const pollData = {
      ...poll.toObject(),
      voteCount,
      results,
      isActive: new Date() < poll.expiration,
    };

    res.json(pollData);
  } catch (error) {
    logger.error("Admin error fetching poll details:", error);
    throw error instanceof ApiError
      ? error
      : new ApiError(400, "Failed to fetch poll details");
  }
};

export const forceEndPoll = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Admin access required");
    }

    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);

    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    // Force end the poll by setting expiration to now
    poll.expiration = new Date();
    await poll.save();

    // Emit socket event
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("pollEnded", { pollId });
      }
    } catch (error) {
      logger.warn("Failed to emit socket event:", error);
    }

    res.json({ message: "Poll ended successfully", poll });
  } catch (error) {
    logger.error("Admin error forcing poll end:", error);
    throw error instanceof ApiError
      ? error
      : new ApiError(400, "Failed to end poll");
  }
};

export const deletePoll = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Admin access required");
    }

    const pollId = req.params.id;
    const poll = await Poll.findByIdAndDelete(pollId);

    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    // Delete all associated votes
    await Vote.deleteMany({ pollId });

    // Emit socket event for real-time updates
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("pollDeleted", { pollId });
      }
    } catch (error) {
      logger.warn("Failed to emit socket event:", error);
      // Continue with the response even if socket emit fails
    }

    res.json({ message: "Poll deleted successfully" });
  } catch (error) {
    logger.error("Error deleting poll:", error);
    throw new ApiError(400, "Failed to delete poll");
  }
};

export const suspendUser = async (req, res) => {
  try {
    // Ensure user is admin
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Admin access required");
    }

    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Don't allow suspending other admins
    if (user.role === "admin" && req.user._id.toString() !== userId) {
      throw new ApiError(403, "Cannot suspend another admin");
    }

    // Toggle suspended status
    user.suspended = !user.suspended;
    await user.save();

    res.json({
      message: user.suspended
        ? "User suspended successfully"
        : "User unsuspended successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        suspended: user.suspended,
      },
    });
  } catch (error) {
    logger.error("Admin error suspending user:", error);
    throw error instanceof ApiError
      ? error
      : new ApiError(400, "Failed to suspend user");
  }
};
