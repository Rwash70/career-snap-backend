const express = require('express');
const router = express.Router();
const SavedJobs = require('../models/savedJobs'); // Correct model name
const authenticateToken = require('../middleware/authenticateToken');

// Get saved jobs
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const jobs = await SavedJobs.find({ userId: req.user.userId });
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching saved jobs:', err);
    res.status(500).json({ message: 'Server error fetching saved jobs' });
  }
});

// Save a new job
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { position, company, url, id } = req.body; // add id

    const newJob = new SavedJobs({
      userId: req.user.userId,
      position,
      company,
      url,
      id, // store job id from remoteok
    });

    await newJob.save();
    res.status(201).json({ message: 'Job saved', job: newJob });
  } catch (err) {
    console.error('Error saving job:', err);
    res.status(500).json({ message: 'Server error saving job' });
  }
});

// Delete a saved job
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const jobId = req.params.id;
    const deleted = await SavedJobs.findOneAndDelete({
      id: jobId, // using the remote job id
      userId: req.user.userId,
    });

    if (!deleted)
      return res.status(404).json({ message: 'Saved job not found' });

    res.json({ message: 'Job removed successfully' });
  } catch (err) {
    console.error('Error deleting saved job:', err);
    res.status(500).json({ message: 'Server error deleting saved job' });
  }
});

module.exports = router;
