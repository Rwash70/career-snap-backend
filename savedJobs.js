const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticateToken = require('./middleware/authenticateToken'); // We will import your JWT middleware from index.js or define here

// SavedJob schema
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

const SavedJob = mongoose.model('SavedJob', savedJobSchema);

// GET saved jobs for logged-in user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const jobs = await SavedJob.find({ userId: req.user.userId });
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching saved jobs:', err);
    res.status(500).json({ message: 'Server error fetching saved jobs' });
  }
});

// POST a new saved job for logged-in user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { position, company, url } = req.body;

    const newJob = new SavedJob({
      userId: req.user.userId,
      position,
      company,
      url,
    });

    await newJob.save();
    res.status(201).json({ message: 'Job saved', job: newJob });
  } catch (err) {
    console.error('Error saving job:', err);
    res.status(500).json({ message: 'Server error saving job' });
  }
});

module.exports = router;
