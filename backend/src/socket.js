const logger = require('./utils/logger');

exports.setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('joinPoll', (pollId) => {
      socket.join(pollId);
      logger.info(`Client ${socket.id} joined poll ${pollId}`);
    });

    socket.on('leavePoll', (pollId) => {
      socket.leave(pollId);
      logger.info(`Client ${socket.id} left poll ${pollId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};