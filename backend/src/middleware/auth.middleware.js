const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { ApiError } = require('../utils/errors');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid token'));
  }
};

exports.isAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }
  next();
};