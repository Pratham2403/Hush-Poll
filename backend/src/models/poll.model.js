import mongoose from "mongoose";
import { PollTypes } from "../../../shared/poll.types.js";

const pollSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    questions: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
        },
        options: [
          {
            type: String,
            required: true,
          },
        ],
        type: {
          type: String,
          enum: Object.values(PollTypes),
          default: PollTypes.SINGLE,
        },
        minValue: {
          type: Number,
          default: 1,
          required: function () {
            return this.type === PollTypes.LINEAR;
          },
        },
        maxValue: {
          type: Number,
          default: 5,
          required: function () {
            return this.type === PollTypes.LINEAR;
          },
        },
      },
    ],

    expiration: {
      type: Date,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    encryptedEmailRegex: {
      type: String,
      required: false,
    },
    encryptedAllowedEmails: [
      {
        type: String,
      },
    ],
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
pollSchema.index({ expiration: 1 });
pollSchema.index({ isPublic: 1 });
pollSchema.index({ creator: 1 });
pollSchema.index({ allowedUsers: 1 });
pollSchema.index({ encryptedAllowedEmails: 1 });

export default mongoose.model("Poll", pollSchema);
