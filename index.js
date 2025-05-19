const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

mongoose
  .connect('mongodb://127.0.0.1:27017/career-snap')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(cors());
// Parse incoming JSON

// Optional: If you want to explicitly set CORS headers (not usually needed with `cors` middleware)
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   next();
// });

// Test route
app.get('/', (req, res) => {
  res.send('Hello World');
});

// Profile schema + model
// const profileSchema = new mongoose.Schema({
//   name: String,
//   email: String,
//   memberSince: String,
//   receiveEmails: Boolean,
//   preferences: String, // New field
// });

// const Profile = mongoose.model('Profile', profileSchema);

// // Save or update profile
// app.post('/profile', async (req, res) => {
//   try {
//     const { name, email, memberSince, receiveEmails, preferences } = req.body;
//     let profile = await Profile.findOne({ email });

//     if (profile) {
//       profile.name = name;
//       profile.memberSince = memberSince;
//       profile.receiveEmails = receiveEmails;
//       profile.preferences = preferences;
//     } else {
//       profile = new Profile({
//         name,
//         email,
//         memberSince,
//         receiveEmails,
//         preferences,
//       });
//     }

//     await profile.save();
//     res.json(profile);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
