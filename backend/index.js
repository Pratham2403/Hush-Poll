import { initializeServer } from "./src/server.js";

// This is the entry point to our application
// It loads the server.js file which contains the Express server setup

require("./src/server");

// Start the server
initializeServer();

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
