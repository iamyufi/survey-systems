// client/src/components/FarewellScreen.js
import React, { useEffect } from 'react';
import axios from 'axios';

function FarewellScreen({ sessionId }) {
  useEffect(() => {
    // Mark the survey as completed
    const completeSurvey = async () => {
      try {
        await axios.post(`/api/survey/complete/${sessionId}`);
      } catch (error) {
        console.error('Fejl ved markering af spørgeskema som afsluttet:', error);
      }
    };
    
    completeSurvey();
  }, [sessionId]);
  
  return (
    <div className="farewell-container">
      <div className="farewell-content">
        <h1>Tak for din deltagelse!</h1>
        <p>
          Vi sætter stor pris på din tid og dine svar. 
          Dine besvarelser vil hjælpe os med at forbedre vores hjemmesidedesigns.
        </p>
        <p>
          Du kan nu lukke dette vindue.
        </p>
      </div>
    </div>
  );
}

export default FarewellScreen;