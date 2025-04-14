import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log error
  logger.error("Error:", {
    statusCode: err.statusCode,
    message: err.message,
    stack: err.stack,
  });

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
