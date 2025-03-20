// client/src/components/QuestionForm.js
import React, { useState, useEffect } from 'react';
import Question from './Question';

function QuestionForm({ questions, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Effect to clean up timeout when component unmounts
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const handleAnswerChange = (questionId, answer) => {
    // Update the answers state immediately
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Clear error if any
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
    
    // For text inputs, use debouncing
    const questionType = questions.find(q => q['@_id'] === questionId)?.['@_type'];
    if (questionType === 'text' || questionType === 'textarea') {
      // Clear any existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // Set a new timeout - only save after 1 second of no typing
      const timeoutId = setTimeout(() => {
        console.log('Saving text input after debounce:', questionId);
        onSubmit({...answers, [questionId]: answer}, true);
      }, 1000);
      
      setSaveTimeout(timeoutId);
    } else {
      // For non-text inputs, save immediately
      console.log('Saving non-text input immediately:', questionId);
      onSubmit({...answers, [questionId]: answer}, true);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Check required fields
    questions.forEach(question => {
      if (question.obligatorisk === 'true' && (!answers[question['@_id']] || answers[question['@_id']] === '')) {
        newErrors[question['@_id']] = 'Dette felt er påkrævet';
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Cancel any pending save timeouts
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    
    // Submit all answers as final submission
    console.log('Submitting final answers');
    onSubmit(answers, false);
    
    // Reset submission state after a short delay
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="question-form">
      {questions.map(question => (
        <div key={question['@_id']} className="question-container">
          <Question
            question={question}
            onChange={(answer) => handleAnswerChange(question['@_id'], answer)}
          />
          
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
        {isSubmitting ? 'Indsender...' : 'Indsend besvarelser'}
      </button>
    </form>
  );
}

export default QuestionForm;