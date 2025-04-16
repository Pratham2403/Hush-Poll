import Poll from "../models/poll.model.js";
import Vote from "../models/vote.model.js";
import User from "../models/user.model.js";
import { PollTypes } from "../../../shared/poll.types.js";
import {
  generateInviteCode,
  encryptData,
  hashEmail,
  encryptRegexPattern,
  decryptRegexPattern,
} from "../utils/crypto.js";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";

export const createPoll = async (req, res) => {
  try {
    const {
      title,
      description,
      questions,
      expiration,
      isPublic,
      invitationRestriction,
    } = req.body;

    // Basic validation
    if (!title) {
      throw new ApiError(400, "Title is required");
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new ApiError(400, "At least one question is required");
    }

    // Validate each question
    questions.forEach((question, index) => {
      if (!question.text) {
        throw new ApiError(
          400,
          `Question text is required for question ${index + 1}`
        );
      }

      // Options are required for all types except linear
      if (
        question.type !== PollTypes.LINEAR &&
        (!question.options || question.options.length < 2)
      ) {
        throw new ApiError(
          400,
          `At least two options are required for question ${index + 1}`
        );
      }
    });

    // Create new poll
    const poll = new Poll({
      creator: req.user?._id,
      title,
      description,
      expiration: new Date(expiration),
      isPublic,
      questions: questions.map((question) => {
        const formattedQuestion = {
          text: question.text,
          type: question.type,
          options: question.options || [],
        };

        // Add type-specific fields for linear questions
        if (question.type === PollTypes.LINEAR) {
          formattedQuestion.minValue = question.minValue || 1;
          formattedQuestion.maxValue = question.maxValue || 5;

          // For linear polls, generate options for the scale
          const range = Array.from(
            {
              length:
                formattedQuestion.maxValue - formattedQuestion.minValue + 1,
            },
            (_, i) => (i + formattedQuestion.minValue).toString()
          );
          formattedQuestion.options = range;
        }

        return formattedQuestion;
      }),
    });

    // Handle private poll settings
    if (!isPublic) {
      // Handle invitation restriction
      if (invitationRestriction) {
        // Check if it's comma-separated emails
        if (invitationRestriction.includes(",")) {
          const emails = invitationRestriction
            .split(",")
            .map((email) => email.trim().toLowerCase())
            .filter((email) => email); // Filter out empty entries

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const invalidEmails = emails.filter(
            (email) => !emailRegex.test(email)
          );

          if (invalidEmails.length > 0) {
            throw new ApiError(
              400,
              `Invalid email format: ${invalidEmails.join(", ")}`
            );
          }

          // Hash each email for privacy and security
          poll.encryptedAllowedEmails = emails.map((email) => hashEmail(email));

          // Find users by email for notification purposes
          const users = await User.find({ email: { $in: emails } });
          if (users.length > 0) {
            poll.allowedUsers = users.map((user) => user._id);
          }

          logger.info(
            `Private poll created with ${emails.length} allowed emails`
          );
        } else {
          // Treat as regex for email matching
          try {
            // Test if valid regex
            new RegExp(invitationRestriction);

            // Encrypt the regex pattern
            poll.encryptedEmailRegex = encryptRegexPattern(
              invitationRestriction
            );

            logger.info(
              "Private poll created with regex pattern for email matching"
            );
          } catch (error) {
            logger.error("Invalid regex pattern:", error);
            throw new ApiError(
              400,
              "Invalid regex pattern for invitation restriction"
            );
          }
        }
      } else {
        // If private but no restriction is provided, log a warning
        logger.warn("Private poll created without access restrictions");
      }
    }

    await poll.save();

    // Emit socket event for real-time updates
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("pollCreated", { pollId: poll._id });
      }
    } catch (error) {
      logger.warn("Failed to emit socket event:", error);
      // Continue with the response even if socket emit fails
    }

    res.status(201).json(poll);
  } catch (error) {
    logger.error("Error creating poll:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, "Failed to create poll");
  }
};

export const getPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    // Check if poll has expired
    const now = new Date();
    const isExpired = now > poll.expiration;

    // If user is admin, they can access any poll
    if (req.user && req.user.role === "admin") {
      return res.json({
        ...poll.toObject(),
        isExpired,
        isAdmin: true,
      });
    }

    // If poll is public, everyone can access it
    if (poll.isPublic) {
      return res.json({
        ...poll.toObject(),
        isExpired,
      });
    }

    // For private polls, check if user is authorized
    // 1. If no user is logged in, deny access
    if (!req.user) {
      throw new ApiError(
        401,
        "Authentication required to access this private poll"
      );
    }

    // 2. Check if user is the creator
    if (poll.creator && poll.creator.equals(req.user._id)) {
      return res.json({
        ...poll.toObject(),
        isExpired,
        isCreator: true,
      });
    }

    // 3. Check if user email hash matches any in the allowed list
    const userEmailHash = hashEmail(req.user.email);
    if (
      poll.encryptedAllowedEmails &&
      poll.encryptedAllowedEmails.includes(userEmailHash)
    ) {
      return res.json({
        ...poll.toObject(),
        isExpired,
        accessGranted: true,
      });
    }

    // 4. Check if user email matches the encrypted regex pattern
    if (poll.encryptedEmailRegex) {
      try {
        const decryptedRegex = decryptRegexPattern(poll.encryptedEmailRegex);
        if (new RegExp(decryptedRegex).test(req.user.email)) {
          return res.json({
            ...poll.toObject(),
            isExpired,
            accessGranted: true,
          });
        }
      } catch (error) {
        logger.error("Error decrypting regex pattern:", error);
      }
    }

    // If we get here, the user doesn't have access
    throw new ApiError(403, "You don't have access to this private poll");
  } catch (error) {
    logger.error("Error fetching poll:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, "Failed to fetch poll");
  }
};

export const submitVote = async (req, res) => {
  try {
    const { responses } = req.body;
    const pollId = req.params.id;

    // Check if user is authenticated
    if (!req.user) {
      throw new ApiError(401, "Authentication required to vote in polls");
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    // Check if poll has expired
    const now = new Date();
    if (now > poll.expiration) {
      throw new ApiError(400, "Poll has expired and no longer accepts votes");
    }

    // If private poll, verify user has access
    if (!poll.isPublic) {
      // Admin can always access
      if (req.user.role === "admin") {
        // Continue with voting
      }
      // Check if user is the creator
      else if (poll.creator && poll.creator.equals(req.user._id)) {
        // Continue with voting
      }
      // Check if user email is in allowed list
      else {
        const userEmailHash = hashEmail(req.user.email);
        const hasEmailAccess =
          poll.encryptedAllowedEmails &&
          poll.encryptedAllowedEmails.includes(userEmailHash);

        // Check if user email matches regex pattern
        let hasRegexAccess = false;
        if (poll.encryptedEmailRegex) {
          try {
            const decryptedRegex = decryptRegexPattern(
              poll.encryptedEmailRegex
            );
            hasRegexAccess = new RegExp(decryptedRegex).test(req.user.email);
          } catch (error) {
            logger.error("Error decrypting regex pattern:", error);
          }
        }

        if (!hasEmailAccess && !hasRegexAccess) {
          throw new ApiError(
            403,
            "You don't have access to vote in this private poll"
          );
        }
      }
    }

    // Create a unique voter token based on user ID to prevent duplicate votes
    const voterToken = req.user._id.toString();

    // Encrypt voter token for privacy
    const encryptedToken = encryptData(voterToken);

    // Check for duplicate votes
    const existingVote = await Vote.findOne({
      pollId,
      voterToken: encryptedToken,
    });

    if (existingVote) {
      throw new ApiError(409, "You have already voted in this poll");
    }

    // Validate responses format
    if (
      !responses ||
      !Array.isArray(responses) ||
      responses.length !== poll.questions.length
    ) {
      throw new ApiError(
        400,
        "Invalid response format - must provide a response for each question"
      );
    }

    // Validate each response against its corresponding question
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const question = poll.questions[i];

      if (!response.questionIdx && response.questionIdx !== 0) {
        throw new ApiError(400, `Missing question index for response ${i + 1}`);
      }

      if (response.questionIdx !== i) {
        throw new ApiError(
          400,
          `Question index mismatch for response ${i + 1}`
        );
      }

      if (
        !response.selectedOptions ||
        !Array.isArray(response.selectedOptions)
      ) {
        throw new ApiError(
          400,
          `Invalid selectedOptions for question ${i + 1}`
        );
      }

      // Validate selected options against question options
      const invalidOptions = response.selectedOptions.filter(
        (option) => !question.options.includes(option)
      );

      if (invalidOptions.length > 0) {
        throw new ApiError(
          400,
          `Invalid option(s) selected for question ${i + 1}`
        );
      }

      // Check poll type for vote validity
      if (
        question.type === PollTypes.SINGLE &&
        response.selectedOptions.length > 1
      ) {
        throw new ApiError(400, `Question ${i + 1} only allows one selection`);
      }
    }

    const vote = new Vote({
      pollId,
      responses,
      voterToken: encryptedToken,
    });

    await vote.save();

    // Emit socket event for real-time updates
    try {
      const io = req.app.get("io");
      if (io) {
        // Get results directly using aggregate query
        const results = await Vote.aggregate([
          { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
          { $unwind: "$responses" },
          {
            $group: {
              _id: {
                questionIdx: "$responses.questionIdx",
                option: "$responses.selectedOptions",
              },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: "$_id.questionIdx",
              results: {
                $push: {
                  option: "$_id.option",
                  count: "$count",
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        io.to(pollId).emit("voteUpdate", results);
      }
    } catch (error) {
      logger.warn("Failed to emit socket event:", error);
      // Continue with the response even if socket emit fails
    }

    res.status(201).json({ message: "Vote recorded successfully" });
  } catch (error) {
    logger.error("Error submitting vote:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, "Failed to submit vote");
  }
};

export const getResults = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    // Admin can access any poll results
    if (req.user && req.user.role === "admin") {
      // Continue to get results
    }
    // For private polls, check access permissions
    else if (!poll.isPublic) {
      // If no user is logged in, deny access
      if (!req.user) {
        throw new ApiError(
          401,
          "Authentication required to access private poll results"
        );
      }

      // Check if user is the creator
      const isCreator = poll.creator && poll.creator.equals(req.user._id);
      if (isCreator) {
        // Continue to get results
      } else {
        // Check if user email hash matches any in the allowed list
        const userEmailHash = hashEmail(req.user.email);
        const hasEmailAccess =
          poll.encryptedAllowedEmails &&
          poll.encryptedAllowedEmails.includes(userEmailHash);

        // Check if user email matches the encrypted regex pattern
        let hasRegexAccess = false;
        if (poll.encryptedEmailRegex) {
          try {
            const decryptedRegex = decryptRegexPattern(
              poll.encryptedEmailRegex
            );
            hasRegexAccess = new RegExp(decryptedRegex).test(req.user.email);
          } catch (error) {
            logger.error("Error decrypting regex pattern:", error);
          }
        }

        // If no access granted, deny access
        if (!hasEmailAccess && !hasRegexAccess) {
          throw new ApiError(
            403,
            "You don't have access to this private poll's results"
          );
        }
      }
    }

    // Get results for each question
    const results = await Vote.aggregate([
      { $match: { pollId: new mongoose.Types.ObjectId(req.params.id) } },
      { $unwind: "$responses" },
      { $unwind: "$responses.selectedOptions" },
      {
        $group: {
          _id: {
            questionIdx: "$responses.questionIdx",
            option: "$responses.selectedOptions",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.questionIdx",
          options: {
            $push: {
              option: "$_id.option",
              count: "$count",
            },
          },
          totalVotes: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format the results with question information
    const formattedResults = results.map((result) => {
      const questionIdx = result._id;
      const question = poll.questions[questionIdx];

      return {
        questionIdx,
        questionText: question.text,
        questionType: question.type,
        options: result.options,
        totalVotes: result.totalVotes,
        ...(question.type === PollTypes.LINEAR
          ? {
              minValue: question.minValue,
              maxValue: question.maxValue,
            }
          : {}),
      };
    });

    res.json(formattedResults);
  } catch (error) {
    logger.error("Error fetching results:", error);
    throw new ApiError(400, "Failed to fetch results");
  }
};

export const getPolls = async (req, res) => {
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

export const getUserPolls = async (req, res) => {
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

export const deletePoll = async (req, res) => {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);

    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    // Check if user is the creator of the poll
    if (
      poll.creator &&
      !poll.creator.equals(req.user._id) &&
      req.user.role !== "admin"
    ) {
      throw new ApiError(403, "You don't have permission to delete this poll");
    }

    // Check if poll is active (not expired)
    const now = new Date();
    if (now < poll.expiration && req.user.role !== "admin") {
      throw new ApiError(
        400,
        "Active polls cannot be deleted. Wait until the poll expires."
      );
    }

    // Delete the poll
    await Poll.findByIdAndDelete(pollId);

    // Delete associated votes
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

    res.status(200).json({ message: "Poll deleted successfully" });
  } catch (error) {
    logger.error("Error deleting poll:", error);
    throw new ApiError(400, "Failed to delete poll");
  }
};

export const getAvailablePrivatePolls = async (req, res) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Get the user's email hash
    const userEmailHash = hashEmail(req.user.email);

    // Find all non-expired private polls
    const now = new Date();
    const privatePollsWithDirectAccess = await Poll.find({
      isPublic: false,
      expiration: { $gt: now },
      encryptedAllowedEmails: userEmailHash,
    })
      .sort({ createdAt: -1 })
      .populate("creator", "name");

    // Get polls that might match the user's email via regex pattern
    const allPrivatePolls = await Poll.find({
      isPublic: false,
      expiration: { $gt: now },
      encryptedEmailRegex: { $exists: true, $ne: null },
    });

    // Filter polls by checking if the user's email matches the regex
    const regexMatchingPolls = await Promise.all(
      allPrivatePolls.map(async (poll) => {
        try {
          if (poll.encryptedEmailRegex) {
            const decryptedRegex = decryptRegexPattern(
              poll.encryptedEmailRegex
            );
            if (new RegExp(decryptedRegex).test(req.user.email)) {
              // Populate the creator name for matching polls
              await poll.populate("creator", "name");
              return poll;
            }
          }
        } catch (error) {
          logger.error(`Error processing regex for poll ${poll._id}:`, error);
        }
        return null;
      })
    );

    // Combine direct access polls with regex matching polls
    const availablePolls = [
      ...privatePollsWithDirectAccess,
      ...regexMatchingPolls.filter(Boolean), // Remove null values
    ];

    res.json(availablePolls);
  } catch (error) {
    logger.error("Error fetching available private polls:", error);
    throw new ApiError(400, "Failed to fetch available polls");
  }
};

export const updatePoll = async (req, res) => {
  try {
    const pollId = req.params.id;
    const poll = await Poll.findById(pollId);

    if (!poll) {
      throw new ApiError(404, "Poll not found");
    }

    // Check if user is the creator of the poll or an admin
    if (
      poll.creator &&
      !poll.creator.equals(req.user._id) &&
      req.user.role !== "admin"
    ) {
      throw new ApiError(403, "You don't have permission to update this poll");
    }

    // Check if poll is active (not expired)
    const now = new Date();
    if (now < poll.expiration) {
      throw new ApiError(
        400,
        "Active polls cannot be updated. Wait until the poll expires."
      );
    }

    const { question, options, type, isPublic, invitationRestriction } =
      req.body;

    // Update basic poll information
    if (question) poll.question = question;
    if (options) poll.options = options;
    if (type) poll.type = type;
    if (typeof isPublic === "boolean") poll.isPublic = isPublic;

    // Handle private poll settings update
    if (isPublic === false && invitationRestriction) {
      // Check if it's comma-separated emails
      if (invitationRestriction.includes(",")) {
        const emails = invitationRestriction
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter((email) => email);

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter((email) => !emailRegex.test(email));

        if (invalidEmails.length > 0) {
          throw new ApiError(
            400,
            `Invalid email format: ${invalidEmails.join(", ")}`
          );
        }

        // Hash each email for privacy and security
        poll.encryptedAllowedEmails = emails.map((email) => hashEmail(email));

        // Find users by email for notification purposes
        const users = await User.find({ email: { $in: emails } });
        if (users.length > 0) {
          poll.allowedUsers = users.map((user) => user._id);
        }
      } else {
        // Treat as regex for email matching
        try {
          // Test if valid regex
          new RegExp(invitationRestriction);

          // Encrypt the regex pattern
          poll.encryptedEmailRegex = encryptRegexPattern(invitationRestriction);
        } catch (error) {
          throw new ApiError(
            400,
            "Invalid regex pattern for invitation restriction"
          );
        }
      }
    }

    await poll.save();

    // Emit socket event for real-time updates
    try {
      const io = req.app.get("io");
      if (io) {
        io.emit("pollUpdated", { pollId: poll._id });
      }
    } catch (error) {
      logger.warn("Failed to emit socket event:", error);
    }

    res.status(200).json(poll);
  } catch (error) {
    logger.error("Error updating poll:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, "Failed to update poll");
  }
};
