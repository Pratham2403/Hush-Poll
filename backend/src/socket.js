import logger from "./utils/logger.js";

/**
 * Initialize and configure Socket.IO for real-time communication
 * @param {Object} io - Socket.IO server instance
 */
const initSocket = (io) => {
  if (!io) {
    logger.error(
      "Failed to initialize WebSocket: Socket.IO instance is undefined"
    );
    return null;
  }

  try {
    // Log socket initialization
    logger.info("Initializing WebSocket server (Socket.IO)");

    // Set up WebSocket connection
    io.on("connection", (socket) => {
      logger.info(`New WebSocket connection established: ${socket.id}`);

      // Join a poll room to receive updates for specific poll
      socket.on("joinPoll", (pollId) => {
        if (!pollId) {
          logger.warn(
            `Socket ${socket.id} attempted to join poll room without valid pollId`
          );
          return;
        }

        socket.join(pollId);
        logger.info(`Socket ${socket.id} joined poll room: ${pollId}`);
      });

      // Leave a poll room
      socket.on("leavePoll", (pollId) => {
        if (!pollId) {
          logger.warn(
            `Socket ${socket.id} attempted to leave poll room without valid pollId`
          );
          return;
        }

        socket.leave(pollId);
        logger.info(`Socket ${socket.id} left poll room: ${pollId}`);
      });

      // Handle client disconnection
      socket.on("disconnect", (reason) => {
        logger.info(`WebSocket disconnected: ${socket.id}, reason: ${reason}`);
      });

      // Handle errors on socket
      socket.on("error", (error) => {
        logger.error(`Socket ${socket.id} error:`, error);
      });
    });

    // Global error handler for the socket server
    io.engine.on("connection_error", (err) => {
      logger.error("Socket.IO connection error:", err);
    });

    logger.info("WebSocket server initialized successfully");
    return io;
  } catch (error) {
    logger.error("Failed to initialize WebSocket server:", error);
    return null;
  }
};

export default initSocket;
