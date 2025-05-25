const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile'); // Use Profile model now
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/reset-password/:token
router.post('/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters.' });
    }

    const profile = await Profile.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!profile) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    profile.password = hashedPassword;
    profile.resetPasswordToken = undefined;
    profile.resetPasswordExpires = undefined;

    await profile.save();

    // Send confirmation email
    const mailOptions = {
      to: profile.email,
      from: process.env.EMAIL_USER,
      subject: 'Your password has been changed',
      text: `Hello ${
        profile.name || 'User'
      },\n\nThis is a confirmation that your password has been successfully changed.\n\nIf you did not perform this action, please contact support immediately.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Password reset successful!' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
