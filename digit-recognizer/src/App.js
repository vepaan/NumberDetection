import React, { useState } from 'react';
import Canvas from './Canvas';
import PredictionPopup from './PredictionPopup';
import './App.css';

const App = () => {
  const [prediction, setPrediction] = useState(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [canvasData, setCanvasData] = useState(null); // Store canvas data

  const handleSubmit = async (canvasData) => {
    setCanvasData(canvasData); // Save canvas data
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ canvasData }),
      });

      const data = await response.json();
      if (data.prediction) {
        setPrediction(data.prediction); // Set prediction state
        setPopupVisible(true); // Show the popup
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("API call failed:", error);
    }
  };

  return (
    <div className='body'>
      <div className='canvas-container'>
        <Canvas onSubmit={handleSubmit} />
        {isPopupVisible && (
          <PredictionPopup
            prediction={prediction}
            canvasData={canvasData}
            closePopup={() => setPopupVisible(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
