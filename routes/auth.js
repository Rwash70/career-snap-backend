const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Profile = require('../models/Profile');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- SIGNUP ---
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, memberSince, receiveEmails, preferences } =
      req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let profile = await Profile.findOne({ email });

    if (profile) {
      profile.name = name;
      profile.password = hashedPassword;
      profile.memberSince = memberSince;
      profile.receiveEmails = receiveEmails;
      profile.preferences = preferences;
    } else {
      profile = new Profile({
        name,
        email,
        password: hashedPassword,
        memberSince,
        receiveEmails,
        preferences,
      });
    }

    await profile.save();
    res.json({ message: 'User signed up', profile });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// --- SIGNIN ---
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const profile = await Profile.findOne({ email });
    if (!profile) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, profile.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign(
      { userId: profile._id, email: profile.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '7d' }
    );

    res.json({ message: 'Sign in successful', token, profile });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ message: 'Server error during signin' });
  }
});

// --- FORGOT PASSWORD ---
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Profile.findOne({ email });
    if (!user) {
      return res.json({
        message:
          'If your email is registered, you will receive reset instructions.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message:
        'If your email is registered, you will receive reset instructions.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res
      .status(500)
      .json({ message: 'Server error during password reset request' });
  }
});

// --- RESET PASSWORD ---
router.post('/reset-password/:token', async (req, res) => {
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

    // Send confirmation email after successful reset
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
