// controllers/surveyController.js
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { XMLParser } = require('fast-xml-parser');
const { validateXml, transformDanishXmlFormat } = require('../utils/xmlParser');

// Constants
const XML_FILE_PATH = path.join(__dirname, '../data/surveys/survey-questions.xml');
const RESPONSES_DIR = path.join(__dirname, '../data/responses');

// Ensure the responses directory exists
const ensureResponsesDir = async () => {
  try {
    await fs.mkdir(RESPONSES_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating responses directory:', error);
  }
};

// XML Parser initialization
const xmlParser = new XMLParser({ 
  ignoreAttributes: false,
  trimValues: true,
  parseAttributeValue: true
});

// Start a new survey session
exports.startSurvey = async (req, res) => {
  try {
    await ensureResponsesDir();
    const sessionId = uuidv4();
    
    console.log(`Creating new survey session: ${sessionId}`);
    
    const responseData = {
      sessionId,
      startTime: new Date().toISOString(),
      answers: [],
      demographics: {},
      completed: false
    };
    
    await fs.writeFile(
      path.join(RESPONSES_DIR, `${sessionId}.json`),
      JSON.stringify(responseData, null, 2)
    );
    
    console.log(`Successfully created survey session: ${sessionId}`);
    return res.json({ sessionId });
  } catch (error) {
    console.error('Error starting survey:', error);
    return res.status(500).json({ error: 'Failed to start survey' });
  }
};

// Get questions for a session
exports.getQuestions = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await ensureResponsesDir();
    
    console.log(`Getting questions for session: ${sessionId}`);
    
    // Check if session exists
    const sessionFile = path.join(RESPONSES_DIR, `${sessionId}.json`);
    try {
      await fs.access(sessionFile);
      console.log(`Session file exists for ${sessionId}`);
    } catch (error) {
      console.error(`Session file not found: ${sessionFile}`, error);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if XML file exists
    try {
      await fs.access(XML_FILE_PATH);
      console.log(`XML file exists at ${XML_FILE_PATH}`);
    } catch (error) {
      console.error(`Survey XML file not found: ${XML_FILE_PATH}`, error);
      return res.status(404).json({ error: 'Survey questions not found' });
    }
    
    // Read and process XML
    const xmlData = await fs.readFile(XML_FILE_PATH, 'utf8');
    const { websites, questions, demographicQuestions, websiteQuestions } = transformDanishXmlFormat(xmlData);
    const parsedData = xmlParser.parse(xmlData);
    
    console.log(`Processed XML data: found ${websites.length} websites, ${questions.length} questions`);
    
    // Handle randomization
    const groups = Array.isArray(parsedData.spørgeskema.spørgsmålsgruppe) 
      ? parsedData.spørgeskema.spørgsmålsgruppe 
      : [parsedData.spørgeskema.spørgsmålsgruppe];
    
    const needsRandomization = groups.some(group => 
      group.tilfældigRækkefølge && group.tilfældigRækkefølge.toString().toLowerCase() === 'true'
    );
    
    const finalWebsites = needsRandomization 
      ? [...websites].sort(() => Math.random() - 0.5) 
      : websites;
    
    console.log(`Returning ${finalWebsites.length} websites, randomization: ${needsRandomization}`);
    
    return res.json({
      websites: finalWebsites,
      questions: questions,
      demographicQuestions: demographicQuestions, 
      websiteQuestions: websiteQuestions
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    return res.status(500).json({ error: 'Failed to retrieve survey questions' });
  }
};

// Submit demographic answers
exports.submitDemographics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answers } = req.body;
    
    console.log(`Submitting demographics for session: ${sessionId}`);
    
    if (!sessionId) {
      console.error('Missing sessionId in demographics submission');
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    await ensureResponsesDir();
    
    // Get session file
    const sessionFile = path.join(RESPONSES_DIR, `${sessionId}.json`);
    try {
      await fs.access(sessionFile);
      console.log(`Found session file for demographics: ${sessionFile}`);
    } catch (error) {
      console.error(`Session file not found for demographics: ${sessionFile}`, error);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Update demographics
    const fileContent = await fs.readFile(sessionFile, 'utf8');
    const responseData = JSON.parse(fileContent);
    
    responseData.demographics = answers;
    responseData.lastUpdated = new Date().toISOString();
    
    await fs.writeFile(sessionFile, JSON.stringify(responseData, null, 2));
    console.log(`Successfully saved demographics for session: ${sessionId}`);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error submitting demographics:', error);
    return res.status(500).json({ error: 'Failed to submit demographics' });
  }
};

// Submit answers for a website
exports.submitAnswers = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { websiteId, answers, viewTime, partial = false } = req.body;
    
    console.log(`Processing submission for session: ${sessionId}, website: ${websiteId}`);
    
    if (!sessionId || !websiteId) {
      console.error('Missing required parameters:', { sessionId, websiteId });
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    await ensureResponsesDir();
    
    // Read session file
    const sessionFile = path.join(RESPONSES_DIR, `${sessionId}.json`);
    let responseData;
    
    try {
      await fs.access(sessionFile);
      const fileContent = await fs.readFile(sessionFile, 'utf8');
      responseData = JSON.parse(fileContent);
      console.log(`Successfully loaded session file for ${sessionId}`);
    } catch (error) {
      console.error(`Error accessing or parsing session file: ${sessionFile}`, error);
      return res.status(404).json({ error: 'Session not found or invalid' });
    }
    
    // Update or add answer
    const currentTimestamp = new Date().toISOString();
    const existingAnswerIndex = responseData.answers.findIndex(a => a.websiteId === websiteId);
    
    console.log(`Answer data received for website ${websiteId}:`, {
      answersLength: Object.keys(answers).length,
      viewTime: viewTime,
      isPartial: partial
    });
    
    if (existingAnswerIndex >= 0) {
      // Update existing answer
      responseData.answers[existingAnswerIndex] = {
        ...responseData.answers[existingAnswerIndex],
        updatedAt: currentTimestamp,
        responses: answers,
        isPartial: partial,
        viewTime: viewTime || responseData.answers[existingAnswerIndex].viewTime
      };
    } else {
      // Add new answer
      responseData.answers.push({
        websiteId,
        viewTime,
        answeredAt: currentTimestamp,
        updatedAt: currentTimestamp,
        responses: answers,
        isPartial: partial
      });
    }
    
    responseData.lastActivity = currentTimestamp;
    
    // Save updated data
    try {
      await fs.writeFile(sessionFile, JSON.stringify(responseData, null, 2));
      console.log(`Successfully saved answers for session ${sessionId}, website ${websiteId}`);
      return res.json({ success: true });
    } catch (writeError) {
      console.error('Error writing to session file:', writeError);
      return res.status(500).json({ error: 'Failed to save answers to file' });
    }
  } catch (error) {
    console.error('Error submitting answers:', error);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    return res.status(500).json({ 
      error: 'Failed to submit answers',
      details: error.message 
    });
  }
};

// Complete survey (for final page)
exports.completeSurvey = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`Completing survey for session: ${sessionId}`);
    
    if (!sessionId) {
      console.error('Missing sessionId in complete survey request');
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    await ensureResponsesDir();
    
    // Update completion status
    const sessionFile = path.join(RESPONSES_DIR, `${sessionId}.json`);
    try {
      await fs.access(sessionFile);
      console.log(`Found session file for completion: ${sessionFile}`);
    } catch (error) {
      console.error(`Session file not found for completion: ${sessionFile}`, error);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const fileContent = await fs.readFile(sessionFile, 'utf8');
    const responseData = JSON.parse(fileContent);
    
    responseData.completed = true;
    responseData.completedAt = new Date().toISOString();
    
    await fs.writeFile(sessionFile, JSON.stringify(responseData, null, 2));
    console.log(`Successfully marked session ${sessionId} as completed`);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error completing survey:', error);
    return res.status(500).json({ error: 'Failed to complete survey' });
  }
};

// Cleanup function to remove old or incomplete survey sessions
exports.cleanupSessions = async (req, res) => {
  try {
    await ensureResponsesDir();
    
    const files = await fs.readdir(RESPONSES_DIR);
    if (!files || files.length === 0) {
      return res.json({ success: true, message: 'No sessions to clean up' });
    }
    
    const now = Date.now();
    const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours
    let cleanedCount = 0;
    
    console.log(`Starting cleanup of sessions older than 24 hours`);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(RESPONSES_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf8');
        const sessionData = JSON.parse(fileContent);
        
        if (!sessionData.completed || 
            (now - new Date(sessionData.startTime).getTime() > cleanupThreshold)) {
          await fs.unlink(filePath);
          cleanedCount++;
          console.log(`Cleaned up session file: ${file}`);
        }
      } catch (error) {
        // Skip invalid files
        console.error(`Error processing file during cleanup: ${file}`, error);
        continue;
      }
    }
    
    console.log(`Cleanup complete: removed ${cleanedCount} sessions`);
    return res.json({ success: true, message: `Cleaned up ${cleanedCount} sessions` });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return res.status(500).json({ error: 'Failed to cleanup sessions' });
  }
};