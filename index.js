require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const savedJobsRoutes = require('./routes/savedJobs');
const resetPasswordRoutes = require('./routes/resetPassword'); // Reset password routes

const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/career-snap')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: 'http://localhost:5173', // Adjust to your frontend URL
    credentials: true,
  })
);

// Test route
app.get('/', (req, res) => res.send('Hello World'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/savedJobs', savedJobsRoutes);

// Mount resetPasswordRoutes under /api/auth/reset-password
app.use('/api/auth/reset-password', resetPasswordRoutes);

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
