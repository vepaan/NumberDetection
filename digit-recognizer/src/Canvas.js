import React, { useRef } from "react";
import CanvasDraw from "react-canvas-draw";
import './App.css';

const Canvas = ({ onSubmit }) => {
  const canvasRef = useRef();

  const handleSubmit = () => {
    const canvasData = canvasRef.current.getSaveData(); // Get the canvas data as JSON
    if (!canvasData || JSON.parse(canvasData).lines.length === 0) {
      alert("Please draw something before submitting.");
      return;
    }
    const base64Data = canvasRef.current.getDataURL(); // Get image data if valid
    onSubmit(base64Data); 
  };

  const clearpicture = () => {
    canvasRef.current.clear();
  };

  return (
    <div className="canvas">
      <h1>Digit Recognizer</h1>
      <CanvasDraw
        ref={canvasRef}
        brushColor="#FFFFFF"
        backgroundColor="#000000"
        canvasWidth={280}
        canvasHeight={280}
        hideGrid={true}
        className="drawing-section"
      />
      <div>
        <button onClick={handleSubmit} className="drawing-button">Submit</button>
        <button onClick={clearpicture} className="drawing-button">Clear</button>
      </div>
    </div>
  );
};

export default Canvas;
