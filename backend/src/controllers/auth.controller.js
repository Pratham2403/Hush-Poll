import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'Email already registered');
    }

    const user = new User({ email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    logger.error('Registration error:', error);
    next(new ApiError(400, 'Registration failed'));
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    
    const user = await User.findOne({ email });
    console.log(user);
    
    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token });
  } catch (error) {
    logger.error('Login error:', error);
    next(new ApiError(400, 'Login failed'));
  }
};