import User from '../models/user.model.js';
import Poll from '../models/poll.model.js';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const getAllPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate('creator', 'email')
      .sort('-createdAt');
    res.json(polls);
  } catch (error) {
    logger.error('Error fetching all polls:', error);
    throw new ApiError(400, 'Failed to fetch polls');
  }
};

export const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findByIdAndDelete(req.params.id);
    if (!poll) {
      throw new ApiError(404, 'Poll not found');
    }
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    logger.error('Error deleting poll:', error);
    throw new ApiError(400, 'Failed to delete poll');
  }
};

export const suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { suspended: true },
      { new: true }
    );
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.json({ message: 'User suspended successfully' });
  } catch (error) {
    logger.error('Error suspending user:', error);
    throw new ApiError(400, 'Failed to suspend user');
  }
};