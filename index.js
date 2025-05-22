const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// MongoDB connection
mongoose
  .connect('mongodb://127.0.0.1:27017/career-snap')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());

// CORS config - allow your frontend origin and credentials
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

// Test route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Profile schema + model
const profileSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  memberSince: String,
  receiveEmails: Boolean,
  preferences: String,
});

const Profile = mongoose.model('Profile', profileSchema);

// --- SavedJob schema + model ---
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

// Middleware to verify JWT token on protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    (err, user) => {
      if (err) return res.sendStatus(403); // Forbidden
      req.user = user;
      next();
    }
  );
}

// --- Saved Jobs routes ---
// Get saved jobs for logged-in user
app.get('/api/savedJobs/me', authenticateToken, async (req, res) => {
  try {
    const jobs = await SavedJob.find({ userId: req.user.userId });
    res.json(jobs);
  } catch (err) {
    console.error('Error fetching saved jobs:', err);
    res.status(500).json({ message: 'Server error fetching saved jobs' });
  }
});

// Save a new job for logged-in user
app.post('/api/savedJobs', authenticateToken, async (req, res) => {
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

// Signup route with password hashing and upsert logic
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password, memberSince, receiveEmails, preferences } =
      req.body;

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if user exists
    let profile = await Profile.findOne({ email });

    if (profile) {
      // Update existing user info and password
      profile.name = name;
      profile.password = hashedPassword;
      profile.memberSince = memberSince;
      profile.receiveEmails = receiveEmails;
      profile.preferences = preferences;
    } else {
      // Create new user
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

// Signin route with JWT token generation
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const profile = await Profile.findOne({ email });
    if (!profile) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, profile.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Create JWT token
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

// Protected route: Get profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findById(req.user.userId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error('Get Profile error:', err);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// Protected route: Edit profile (only memberSince and preferences)
app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { memberSince, preferences } = req.body;

    const updatedProfile = await Profile.findByIdAndUpdate(
      req.user.userId,
      { memberSince, preferences },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('Edit Profile error:', err);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
