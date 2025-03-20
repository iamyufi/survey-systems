// controllers/adminController.js
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validateXml } = require('../utils/xmlParser');

// Admin credentials (should be in environment variables or database)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '$2b$10$g7f2e1B93mHmVFgCocen6Oci33m0KpS4YfFJEKG/1qeiCnhTLSLG6'; // hashed 'admin123' - Updated to the correct hash

// Paths
const SURVEYS_DIR = path.join(__dirname, '../data/surveys');
const RESPONSES_DIR = path.join(__dirname, '../data/responses');

// Ensure directories exist
const ensureDirectories = () => {
  if (!fs.existsSync(SURVEYS_DIR)) {
    fs.mkdirSync(SURVEYS_DIR, { recursive: true });
  }
  if (!fs.existsSync(RESPONSES_DIR)) {
    fs.mkdirSync(RESPONSES_DIR, { recursive: true });
  }
};

// Login admin
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check credentials
    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload survey XML file
exports.uploadSurvey = (req, res) => {
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate XML
    const xmlData = fs.readFileSync(req.file.path, 'utf8');
    const validationResult = validateXml(xmlData);
    
    if (!validationResult.valid) {
      // Delete invalid file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid XML file', details: validationResult.errors });
    }
    
    // Rename file to standard name
    fs.renameSync(req.file.path, path.join(SURVEYS_DIR, 'survey-questions.xml'));
    
    res.json({ success: true, message: 'Survey uploaded successfully' });
  } catch (error) {
    console.error('Error uploading survey:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all responses
exports.getResponses = (req, res) => {
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Check if directory exists and is readable
    if (!fs.existsSync(RESPONSES_DIR)) {
      console.error('Responses directory not found:', RESPONSES_DIR);
      return res.json([]);
    }
    
    // Read all response files
    const files = fs.readdirSync(RESPONSES_DIR);
    
    if (!files || files.length === 0) {
      return res.json([]);
    }
    
    const responses = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(RESPONSES_DIR, file), 'utf8'));
          return {
            id: data.sessionId,
            startTime: data.startTime,
            answersCount: data.answers.length
          };
        } catch (err) {
          console.error('Error parsing file:', file, err);
          return null;
        }
      })
      .filter(item => item !== null); // Remove any nulls from parsing errors
    
    console.log('Found responses:', responses.length);
    res.json(responses);
  } catch (error) {
    console.error('Error getting responses:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Download a specific response
exports.downloadResponse = (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(RESPONSES_DIR, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading response:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get survey statistics
exports.getStats = (req, res) => {
  try {
    // Ensure directories exist
    ensureDirectories();
    
    if (!fs.existsSync(RESPONSES_DIR)) {
      console.error('Responses directory not found:', RESPONSES_DIR);
      return res.json({
        totalResponses: 0,
        totalAnswers: 0,
        averageAnswersPerResponse: 0
      });
    }
    
    const files = fs.readdirSync(RESPONSES_DIR);
    const responses = files.filter(file => file.endsWith('.json'));
    
    // Calculate statistics
    let totalResponses = 0;
    let totalAnswers = 0;
    
    responses.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(RESPONSES_DIR, file), 'utf8'));
        totalResponses++;
        totalAnswers += data.answers.length;
      } catch (err) {
        console.error('Error parsing file for stats:', file, err);
      }
    });
    
    res.json({
      totalResponses,
      totalAnswers,
      averageAnswersPerResponse: totalResponses > 0 ? totalAnswers / totalResponses : 0
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
};