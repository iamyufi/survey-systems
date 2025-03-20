// client/src/components/Question.js
import React from 'react';

function Question({ question, onChange }) {
  const renderQuestionInput = () => {
    const type = question['@_type'];
    
    switch (type) {
      case 'text':
        return (
          <input
            type="text"
            className="text-input"
            onChange={(e) => {
              console.log('Text input changed:', e.target.value);
              onChange(e.target.value);
            }}
            required
          />
        );
      
      case 'textarea':
        return (
          <textarea
            className="textarea-input"
            rows="4"
            onChange={(e) => {
              console.log('Textarea input changed:', e.target.value);
              onChange(e.target.value);
            }}
            required
          />
        );
      
      case 'radio':
        const options = question.options.option;
        return (
          <div className="radio-group">
            {Array.isArray(options) ? options.map(option => (
              <label key={option['@_value']} className="radio-label">
                <input
                  type="radio"
                  name={`question-${question['@_id']}`}
                  value={option['@_value']}
                  onChange={() => {
                    console.log('Radio selected:', option['@_value']);
                    onChange(option['@_value']);
                  }}
                  required
                />
                {option['#text']}
              </label>
            )) : (
              <label className="radio-label">
                <input
                  type="radio"
                  name={`question-${question['@_id']}`}
                  value={options['@_value']}
                  onChange={() => {
                    console.log('Radio selected:', options['@_value']);
                    onChange(options['@_value']);
                  }}
                  required
                />
                {options['#text']}
              </label>
            )}
          </div>
        );
      
      case 'checkbox':
        const checkboxOptions = question.options.option;
        return (
          <div className="checkbox-group">
            {Array.isArray(checkboxOptions) ? checkboxOptions.map(option => (
              <label key={option['@_value']} className="checkbox-label">
                <input
                  type="checkbox"
                  name={`question-${question['@_id']}`}
                  value={option['@_value']}
                  onChange={(e) => {
                    const checkboxes = document.querySelectorAll(`input[name="question-${question['@_id']}"]:checked`);
                    const values = Array.from(checkboxes).map(cb => cb.value);
                    console.log('Checkbox values:', values);
                    onChange(values);
                  }}
                />
                {option['#text']}
              </label>
            )) : (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name={`question-${question['@_id']}`}
                  value={checkboxOptions['@_value']}
                  onChange={(e) => {
                    const value = e.target.checked ? [checkboxOptions['@_value']] : [];
                    console.log('Checkbox value:', value);
                    onChange(value);
                  }}
                />
                {checkboxOptions['#text']}
              </label>
            )}
          </div>
        );
      
      case 'select':
        const selectOptions = question.options.option;
        return (
          <select
            className="select-input"
            onChange={(e) => {
              console.log('Select changed:', e.target.value);
              onChange(e.target.value);
            }}
            required
          >
            <option value="">Vælg en mulighed</option>
            {Array.isArray(selectOptions) ? selectOptions.map(option => (
              <option key={option['@_value']} value={option['@_value']}>
                {option['#text']}
              </option>
            )) : (
              <option value={selectOptions['@_value']}>
                {selectOptions['#text']}
              </option>
            )}
          </select>
        );
      
      case 'scale':
        const min = parseInt(question['@_min'] || '1');
        const max = parseInt(question['@_max'] || '5');
        const scaleOptions = [];
        
        for (let i = min; i <= max; i++) {
          scaleOptions.push(i);
        }
        
        return (
          <div className="scale-group">
            <div className="scale-labels">
              <span>{question['@_minLabel'] || min}</span>
              <span>{question['@_maxLabel'] || max}</span>
            </div>
            <div className="scale-inputs">
              {scaleOptions.map(value => (
                <label key={value} className="scale-option">
                  <input
                    type="radio"
                    name={`question-${question['@_id']}`}
                    value={value}
                    onChange={() => {
                      console.log('Scale selected:', value);
                      onChange(value);
                    }}
                    required
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      default:
        return <p className="error">Ukendt spørgsmålstype: {type}</p>;
    }
  };

  return (
    <div className="question">
      <h3 className="question-text">{question.text}</h3>
      {question.description && (
        <p className="question-description">{question.description}</p>
      )}
      {renderQuestionInput()}
    </div>
  );
}

export default Question;