// client/src/components/WebsiteDisplay.js
import React from 'react';

function WebsiteDisplay({ website, onShowSurvey }) {
  return (
    <div className="website-display">
      <div className="website-info">
        <h2>{website.name}</h2>
        <p className="website-description">{website.description}</p>
      </div>
      
      <div className="website-frame">
        <iframe
          src={website['@_url']}
          title={`Hjemmeside ${website['@_id']}`}
          width="100%"
          height="600px"
          frameBorder="0"
        />
      </div>
      
      <button 
        className="survey-button"
        onClick={onShowSurvey}
      >
        Tag spørgeskema om denne hjemmeside
      </button>
    </div>
  );
}

export default WebsiteDisplay;