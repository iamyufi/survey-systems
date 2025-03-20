// client/src/components/WelcomeSurvey.js
import React, { useState } from 'react';
import axios from 'axios';

function WelcomeSurvey({ sessionId, onComplete, demographicQuestions }) {
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Clear error for this question if it exists
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Check required fields
    demographicQuestions.forEach(question => {
      if (question.obligatorisk === 'true' && (!answers[question['@_id']] || answers[question['@_id']] === '')) {
        newErrors[question['@_id']] = 'Dette felt er påkrævet';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting demographics for session:', sessionId);
      console.log('Demographics data:', answers);
      
      // Send demographic answers to server
      const response = await axios.post(`/api/survey/demographics/${sessionId}`, {
        answers
      });
      
      console.log('Demographics submission response:', response.data);
      
      if (response.data.success) {
        // Go to first website design
        onComplete();
      } else {
        setErrors({ submit: 'Der opstod en fejl ved indsendelse. Prøv venligst igen.' });
      }
    } catch (err) {
      console.error('Fejl ved indsendelse af demografiske data:', err);
      setErrors({ submit: 'Der opstod en fejl. Prøv venligst igen.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderQuestionInput = (question) => {
    const type = question['@_type'];
    
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            className={`text-input ${errors[question['@_id']] ? 'error-input' : ''}`}
            onChange={(e) => handleChange(question['@_id'], e.target.value)}
            required={question.obligatorisk === 'true'}
          />
        );
      
      case 'select':
        if (!question.options || !question.options.option) {
          return <p className="error">Ingen muligheder tilgængelige</p>;
        }
        
        const options = Array.isArray(question.options.option) 
          ? question.options.option 
          : [question.options.option];
          
        return (
          <select 
            className={`select-input ${errors[question['@_id']] ? 'error-input' : ''}`}
            onChange={(e) => handleChange(question['@_id'], e.target.value)}
            required={question.obligatorisk === 'true'}
          >
            <option value="">Vælg en mulighed</option>
            {options.map((option, index) => (
              <option key={index} value={option['@_value'] || option}>
                {option['#text'] || option}
              </option>
            ))}
          </select>
        );
      
      default:
        return <p className="error">Ukendt spørgsmålstype: {type}</p>;
    }
  };
  
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>Velkommen til hjemmesidedesign undersøgelsen</h1>
        <p>
          Denne undersøgelse handler om at evaluere forskellige hjemmesidedesigns.
          Du vil blive præsenteret for tre forskellige hjemmesider og bedt om at
          give din mening om hver af dem.
        </p>
        <p>
          Først beder vi dig om at udfylde nogle få oplysninger om dig selv.
          Alle data behandles anonymt.
        </p>
        
        {errors.submit && <div className="error-message">{errors.submit}</div>}
        
        <form onSubmit={handleSubmit} className="demographic-form">
          {demographicQuestions.map(question => (
            <div key={question['@_id']} className="question demographic-question">
              <label className="question-label">
                {question.text}
                {question.obligatorisk === 'true' && <span className="required">*</span>}
              </label>
              
              {renderQuestionInput(question)}
              
              {errors[question['@_id']] && (
                <div className="error-text">{errors[question['@_id']]}</div>
              )}
            </div>
          ))}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Behandler...' : 'Start undersøgelsen'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default WelcomeSurvey;