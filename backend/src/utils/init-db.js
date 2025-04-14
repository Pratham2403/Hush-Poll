import mongoose from "mongoose";
import User from "../models/user.model.js";
import Poll from "../models/poll.model.js";
import bcrypt from "bcryptjs";
import logger from "./logger.js";
import dotenv from "dotenv";
import { PollTypes } from "../../../shared/poll.types.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/polling-app")
  .then(() => logger.info("Connected to MongoDB"))
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Create default admin user and sample data
async function initializeDatabase() {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ email: "admin@example.com" });

    let adminUser;
    if (!adminExists) {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 10);
      adminUser = await User.create({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      });
      logger.info("Admin user created");
    } else {
      adminUser = adminExists;
      logger.info("Admin user already exists");
    }

    // Check if we have any polls
    const pollCount = await Poll.countDocuments();

    if (pollCount === 0) {
      // Create sample polls
      const samplePolls = [
        {
          creator: adminUser._id,
          title: "Programming Preferences Survey",
          description: "Help us understand developer preferences in 2025",
          questions: [
            {
              text: "What is your favorite programming language?",
              options: [
                "JavaScript",
                "Python",
                "Java",
                "C++",
                "Ruby",
                "Go",
                "Rust",
              ],
              type: PollTypes.SINGLE,
            },
            {
              text: "Which frontend frameworks do you use regularly?",
              options: [
                "React",
                "Vue",
                "Angular",
                "Svelte",
                "Next.js",
                "Nuxt",
                "Astro",
              ],
              type: PollTypes.MULTIPLE,
            },
            {
              text: "On a scale of 1-10, how important is type safety to you?",
              options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
              type: PollTypes.LINEAR,
              minValue: 1,
              maxValue: 10,
            },
          ],
          expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isPublic: true,
        },
        {
          creator: adminUser._id,
          title: "Team Collaboration Tools",
          description: "Help us decide on the best tools for our organization",
          questions: [
            {
              text: "Which project management tool do you prefer?",
              options: [
                "Jira",
                "Asana",
                "Trello",
                "ClickUp",
                "Monday",
                "Linear",
              ],
              type: PollTypes.SINGLE,
            },
            {
              text: "Which communication tools do you use daily?",
              options: [
                "Slack",
                "Microsoft Teams",
                "Discord",
                "Email",
                "Telegram",
                "WhatsApp",
              ],
              type: PollTypes.MULTIPLE,
            },
            {
              text: "Rate the importance of real-time collaboration features",
              options: ["1", "2", "3", "4", "5"],
              type: PollTypes.LINEAR,
              minValue: 1,
              maxValue: 5,
            },
          ],
          expiration: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          isPublic: true,
        },
        {
          creator: adminUser._id,
          title: "Private Team Meeting Preferences",
          description:
            "Please vote on meeting preferences for the development team",
          questions: [
            {
              text: "What is your preferred meeting time?",
              options: [
                "Morning (9-11 AM)",
                "Noon (12-2 PM)",
                "Afternoon (3-5 PM)",
              ],
              type: PollTypes.SINGLE,
            },
            {
              text: "Which meeting format do you prefer?",
              options: ["In-person", "Video call", "Hybrid"],
              type: PollTypes.DROPDOWN,
            },
            {
              text: "How many team meetings per week would you prefer?",
              options: ["1", "2", "3", "4", "5"],
              type: PollTypes.SINGLE,
            },
          ],
          expiration: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          isPublic: false,
        },
      ];

      await Poll.insertMany(samplePolls);
      logger.info(`${samplePolls.length} sample polls created`);
    } else {
      logger.info(`${pollCount} polls already exist`);
    }

    logger.info("Database initialization completed");
    process.exit(0);
  } catch (error) {
    logger.error("Error initializing database:", error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
