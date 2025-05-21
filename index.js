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

// CORS config
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
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  memberSince: String,
  receiveEmails: Boolean,
  preferences: String,
});

const Profile = mongoose.model('Profile', profileSchema);

// Signup route with password hashing
app.post('/signup', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to verify JWT token on protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Token:', token);

  if (!token) return res.sendStatus(401);

  console.log('JWT Secret:', process.env.JWT_SECRET || 'your_jwt_secret_key');
  jwt.verify(
    token,
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    }
  );
}

// // jwt.verify(token, jwtSecret, (err, user) => {
// //   if (err) {
// //     console.error('JWT verification error:', err);
// //     return res.sendStatus(403);
// //   }
// //   req.user = user;
// //   next();
// });

// Example protected route - Get profile
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findById(req.user.userId);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit profile route (only memberSince and preferences)
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
    console.error('Edit Profile Error:', err);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Password reset route (protected)
app.post('/reset-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Both current and new passwords are required' });
    }

    const user = await Profile.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
