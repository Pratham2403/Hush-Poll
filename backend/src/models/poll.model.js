const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true
  }],
  type: {
    type: String,
    enum: ['single', 'multiple', 'open'],
    default: 'single'
  },
  expiration: {
    type: Date,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  inviteCodes: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
pollSchema.index({ expiration: 1 });
pollSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Poll', pollSchema);