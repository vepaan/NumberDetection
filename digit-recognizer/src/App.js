import React, { useState } from 'react';
import Canvas from './Canvas';
import PredictionPopup from './PredictionPopup';
import './App.css';

const App = () => {
  const [prediction, setPrediction] = useState(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [canvasData, setCanvasData] = useState(null); // Store canvas data

  //const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleSubmit = async (canvasData) => {
    setCanvasData(canvasData); // Save canvas data
    try {
      console.log("Sending data:", { canvasData });
      const response = await fetch("https://digit-reco-backend-eiwupd3i9-visions-projects-ef94ff33.vercel.app/predict", { //backend url
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ canvasData }),
      });

      const data = await response.json();
      console.log(data.prediction)
      if (data.prediction !== undefined && data.prediction !== null) {
        console.log(data.prediction)
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
