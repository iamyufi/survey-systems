// client/src/components/Survey.js
import React, { useState, useEffect, useCallback } from 'react';
import WebsiteDisplay from './WebsiteDisplay';
import QuestionForm from './QuestionForm';
import WelcomeSurvey from './WelcomeSurvey';
import FarewellScreen from './FarewellScreen';
import axios from 'axios';

function Survey() {
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [websiteQuestions, setWebsiteQuestions] = useState([]);
  const [demographicQuestions, setDemographicQuestions] = useState([]);
  const [currentWebsiteIndex, setCurrentWebsiteIndex] = useState(0);
  const [showSurvey, setShowSurvey] = useState(false);
  const [viewStartTime, setViewStartTime] = useState(null);
  const [surveyStep, setSurveyStep] = useState('welcome'); // 'welcome', 'websites', 'farewell'

  // Use useCallback to prevent unnecessary recreation of this function
  const startNewSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Force creation of a new session
      localStorage.removeItem('surveySessionId');
      
      // Use the current timestamp to ensure uniqueness
      const timestamp = new Date().getTime();
      console.log('Starting new survey session with timestamp:', timestamp);
      
      const response = await axios.get(`/api/survey/start?timestamp=${timestamp}`);
      const { sessionId } = response.data;
      
      console.log('Created new session:', sessionId);
      
      // Store session ID in local storage
      localStorage.setItem('surveySessionId', sessionId);
      setSessionId(sessionId);
      
      fetchSurveyData(sessionId);
    } catch (err) {
      console.error('Error starting session:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      setError('Kunne ikke starte spørgeskemaet. Prøv venligst igen.');
      setLoading(false);
    }
  }, []);

  const fetchSurveyData = async (id) => {
    try {
      console.log('Fetching survey data for session:', id);
      setError(null);
      
      const response = await axios.get(`/api/survey/questions/${id}`);
      
      console.log('Survey data received:', {
        websitesCount: response.data.websites.length,
        questionsCount: response.data.questions.length,
        demographicQuestionsCount: response.data.demographicQuestions.length,
        websiteQuestionsCount: response.data.websiteQuestions.length
      });
      
      setWebsites(response.data.websites);
      setWebsiteQuestions(response.data.websiteQuestions);
      setDemographicQuestions(response.data.demographicQuestions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching survey data:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      
      // If session not found, create a new one
      if (err.response?.status === 404) {
        console.log('Session not found during data fetch, creating new one');
        startNewSession();
      } else {
        setError('Kunne ikke indlæse spørgeskemadata. Prøv venligst igen.');
        setLoading(false);
      }
    }
  };

  // Validate session periodically
  const validateSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      // Simple ping to check if session exists
      await axios.get(`/api/survey/questions/${sessionId}`);
      console.log('Session validation successful');
    } catch (err) {
      console.error('Session validation failed:', err);
      if (err.response?.status === 404) {
        console.log('Session not found during validation, creating new one');
        startNewSession();
      }
    }
  }, [sessionId, startNewSession]);

  useEffect(() => {
    // Check if we have a session ID already
    const existingSessionId = localStorage.getItem('surveySessionId');
    
    if (existingSessionId) {
      console.log('Resuming existing session:', existingSessionId);
      setSessionId(existingSessionId);
      fetchSurveyData(existingSessionId);
    } else {
      // Only start a new session if we don't have one
      console.log('No existing session found, creating new one');
      startNewSession();
    }
  }, [startNewSession]); // Add startNewSession as a dependency
  
  // Validate session when component mounts and when sessionId changes
  useEffect(() => {
    if (sessionId) {
      validateSession();
    }
  }, [sessionId, validateSession]);

  // Add an effect to handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Complete the survey if user leaves
      const currentSessionId = localStorage.getItem('surveySessionId');
      if (currentSessionId) {
        try {
          // Use sendBeacon for more reliable sending during page unload
          const data = new Blob([JSON.stringify({})], { type: 'application/json' });
          navigator.sendBeacon(`/api/survey/complete/${currentSessionId}`, data);
          console.log('Survey completed via beforeunload event');
        } catch (e) {
          console.error('Error completing survey on unload:', e);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleDemographicsComplete = () => {
    console.log('Demographics complete, moving to websites step');
    setSurveyStep('websites');
    setViewStartTime(new Date());
  };

  const handleShowSurvey = () => {
    console.log('Showing survey for website:', currentWebsiteIndex + 1);
    setShowSurvey(true);
  };

  const handleSubmitAnswers = async (answers, isPartial = false) => {
    try {
      // Validate session ID
      if (!sessionId || sessionId.trim() === '') {
        console.error('Invalid sessionId:', sessionId);
        setError('Ugyldig session - genindlæs venligst siden');
        return;
      }
      
      const viewEndTime = new Date();
      const viewTime = viewStartTime ? (viewEndTime - viewStartTime) / 1000 : 0; // in seconds
      
      if (!websites || !websites[currentWebsiteIndex]) {
        console.error('Website data not available at index:', currentWebsiteIndex);
        setError('Hjemmesidedata mangler - genindlæs venligst siden');
        return;
      }
      
      const currentWebsite = websites[currentWebsiteIndex];
      const websiteId = currentWebsite['@_id'];
      
      if (!websiteId) {
        console.error('Missing website ID for index:', currentWebsiteIndex, currentWebsite);
        setError('Hjemmeside-ID mangler - genindlæs venligst siden');
        return;
      }
      
      console.log(`${isPartial ? 'Saving partial' : 'Submitting final'} answers for website:`, websiteId);
      console.log('Answers data:', JSON.stringify(answers).substring(0, 200) + '...');
      console.log('View time:', viewTime, 'seconds');
      
      // Save answers
      const response = await axios.post(`/api/survey/submit/${sessionId}`, {
        websiteId: websiteId,
        answers,
        viewTime,
        partial: isPartial
      });
      
      console.log('Submit response:', response.data);
      
      // Only proceed to next step for final submissions (not partial ones)
      if (!isPartial) {
        // Move to next website or complete survey
        if (currentWebsiteIndex < websites.length - 1) {
          setCurrentWebsiteIndex(currentWebsiteIndex + 1);
          setShowSurvey(false);
          setViewStartTime(new Date());
        } else {
          // Explicitly complete the survey
          try {
            const completeResponse = await axios.post(`/api/survey/complete/${sessionId}`);
            console.log('Survey completed successfully:', completeResponse.data);
          } catch (completeErr) {
            console.error('Error marking survey as complete:', completeErr);
            console.error('Error details:', completeErr.response?.data || 'No response data');
          }
          
          setSurveyStep('farewell');
          
          // Start fresh for next user
          localStorage.removeItem('surveySessionId');
        }
      }
    } catch (err) {
      console.error('Error submitting answers:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      
      // Check if server is unreachable
      if (err.code === 'ECONNABORTED' || !err.response) {
        setError('Kunne ikke nå serveren. Kontrollér din internetforbindelse og prøv igen.');
      } else if (err.response?.status === 404) {
        console.log('Session not found, creating new one');
        startNewSession();
      } else {
        setError('Kunne ikke indsende svar. Prøv venligst igen.');
      }
    }
  };

  if (loading) {
    return <div className="loading">Indlæser spørgeskema...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button 
          className="retry-button" 
          onClick={() => {
            setError(null);
            startNewSession();
          }}
        >
          Prøv igen
        </button>
      </div>
    );
  }

  // Render different steps of the survey
  if (surveyStep === 'welcome') {
    return (
      <WelcomeSurvey 
        sessionId={sessionId}
        onComplete={handleDemographicsComplete}
        demographicQuestions={demographicQuestions}
      />
    );
  }

  if (surveyStep === 'farewell') {
    return <FarewellScreen sessionId={sessionId} />;
  }

  // Website survey flow
  const currentWebsite = websites[currentWebsiteIndex];

  return (
    <div className="survey-container">
      {!showSurvey ? (
        <div className="website-view">
          <WebsiteDisplay
            website={currentWebsite}
            onShowSurvey={handleShowSurvey}
          />
        </div>
      ) : (
        <div className="question-form">
          <h2>Spørgsmål om hjemmesiden</h2>
          <QuestionForm
            questions={websiteQuestions}
            onSubmit={handleSubmitAnswers}
          />
        </div>
      )}
      <div className="progress">
        Hjemmeside {currentWebsiteIndex + 1} af {websites.length}
      </div>
    </div>
  );
}

export default Survey;