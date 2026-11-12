const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Import route files
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

// Load environment variables from .env configuration
dotenv.config();

// Initialize database connection
connectDB();

const app = express();

// Global Middlewares: Enable Cross-Origin Resource Sharing and parse JSON payloads
app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tickets', ticketRoutes);

// Health check route to verify API status
app.get('/', (req, res) => {
  res.status(200).send('Bug Tracker Backend API is running...');
});

const PORT = process.env.PORT || 5000;

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});