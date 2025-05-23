const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  memberSince: { type: String },
  receiveEmails: { type: Boolean },
  preferences: { type: String },

  // For password reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

module.exports = mongoose.model('Profile', profileSchema);
