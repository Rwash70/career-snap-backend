const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const authenticateToken = require('../middleware/authenticateToken');

// Get profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findById(req.user.userId);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error('Get Profile error:', err);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { memberSince, preferences, receiveEmails } = req.body;

    const updatedProfile = await Profile.findByIdAndUpdate(
      req.user.userId,
      { memberSince, preferences, receiveEmails },
      { new: true }
    );

    if (!updatedProfile)
      return res.status(404).json({ message: 'Profile not found' });

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('Edit Profile error:', err);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

module.exports = router;
