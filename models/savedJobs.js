const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  position: String,
  company: String,
  url: String,
  savedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SavedJob', savedJobSchema);
