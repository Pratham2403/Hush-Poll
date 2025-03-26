const mongoose = require("mongoose");
const User = require("../models/user.model");
const Poll = require("../models/poll.model");
const bcrypt = require("bcryptjs");
const logger = require("./logger");
const dotenv = require("dotenv");

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
          question: "What is your favorite programming language?",
          options: ["JavaScript", "Python", "Java", "C++", "Ruby"],
          type: "single",
          expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          isPublic: true,
        },
        {
          creator: adminUser._id,
          question: "Which frontend frameworks do you use?",
          options: ["React", "Vue", "Angular", "Svelte", "Next.js"],
          type: "multiple",
          expiration: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          isPublic: true,
        },
        {
          creator: adminUser._id,
          question: "Private poll: Meeting time preference",
          options: [
            "Morning (9-11 AM)",
            "Noon (12-2 PM)",
            "Afternoon (3-5 PM)",
          ],
          type: "single",
          expiration: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          isPublic: false,
          inviteCodes: ["secret123"],
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
