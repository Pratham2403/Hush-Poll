import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  selectedOptions: [{
    type: String,
    required: true
  }],
  voterToken: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound index for preventing duplicate votes
voteSchema.index({ pollId: 1, voterToken: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);