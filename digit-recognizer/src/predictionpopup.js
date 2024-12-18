import React, { useState } from 'react';
import axios from 'axios';

const PredictionPopup = ({ canvasData, prediction, closePopup }) => {
  const [isCorrect, setIsCorrect] = useState(null);
  const [actualLabel, setActualLabel] = useState('');  // Store user input for correction

  // Handle clicking 'Yes'
  const handleYes = () => {
    saveLabel(prediction, true); // Save prediction as correct
    closePopup(); // Close the popup
  };

  // Handle clicking 'No'
  const handleNo = () => {
    setIsCorrect(false); // Trigger the input field display
  };

  // Track changes in the correction input
  const handleLabelChange = (e) => {
    setActualLabel(e.target.value);
  };

  // Handle submitting corrected label
  const handleSubmitLabel = () => {
    if (actualLabel.trim() !== '') {
      saveLabel(actualLabel, false); // Save user-provided label as correction
      closePopup(); // Close the popup
    } else {
      alert('Please enter a valid number.'); // Validation
    }
  };

  // Save label data (to backend)
  const saveLabel = async (label, correct) => {
    try {
      await axios.post('http://localhost:8000/update-label', {
        canvasData: canvasData,
        prediction: prediction,
        actualLabel: label,
        isCorrect: correct,
      });
    } catch (error) {
      console.error('Error updating label:', error);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h2>Prediction: {prediction}</h2>
        <p>Was this prediction correct?</p>
        <div className="button-group">
          <button onClick={handleYes}>Yes</button>
          <button onClick={handleNo}>No</button>
        </div>

        {/* Show input for correction if 'No' is selected */}
        {isCorrect === false && (
          <div className="correction-input">
            <label>
              Enter the correct number:
              <input
                type="number"
                value={actualLabel}
                onChange={handleLabelChange}
                placeholder="e.g., 3"
              />
            </label>
            <button onClick={handleSubmitLabel}>Submit</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionPopup;
