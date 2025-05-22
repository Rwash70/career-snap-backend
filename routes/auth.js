const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, memberSince, receiveEmails, preferences } =
      req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let profile = await Profile.findOne({ email });

    if (profile) {
      // Update existing user info and password
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

// Signin
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

module.exports = router;
