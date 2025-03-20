require('dotenv').config();
// rest of your imports...

// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const xmlParser = require('fast-xml-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Specifically serve website designs
app.use('/designs', express.static(path.join(__dirname, 'public/designs')));

// Serve React app in production
app.use(express.static(path.join(__dirname, '../client/build')));

// Ensure data directories exist
const dataDir = path.join(__dirname, 'data');
const surveysDir = path.join(dataDir, 'surveys');
const responsesDir = path.join(dataDir, 'responses');
const designsDir = path.join(__dirname, 'public/designs');

[dataDir, surveysDir, responsesDir, designsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Should be in environment variables

// Routes
app.use('/api/survey', require('./routes/surveyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve React app for all other routes in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;