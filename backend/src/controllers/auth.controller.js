import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ApiError } from "../utils/errors.js";
import logger from "../utils/logger.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "Email already registered");
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Registration error:", error);
    next(new ApiError(400, "Registration failed"));
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Check if user is suspended
    if (user.suspended) {
      throw new ApiError(
        403,
        "Your account has been suspended. Please contact support for assistance."
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Return user info and token
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    throw error instanceof ApiError ? error : new ApiError(400, "Login failed");
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logger.error("Profile fetch error:", error);
    next(new ApiError(400, "Failed to fetch profile"));
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Validate inputs
    if (!name && !email) {
      return next(new ApiError(400, "No fields to update"));
    }

    // Check if email is being updated and is not already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new ApiError(400, "Email already in use"));
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(email && { email }),
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return next(new ApiError(404, "User not found"));
    }

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    logger.error("Profile update error:", error);
    next(new ApiError(400, "Failed to update profile"));
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return next(
        new ApiError(400, "Current password and new password are required")
      );
    }

    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return next(new ApiError(400, "Current password is incorrect"));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    logger.error("Password change error:", error);
    next(new ApiError(400, "Failed to change password"));
  }
};
