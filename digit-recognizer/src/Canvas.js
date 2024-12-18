import React, { useRef } from "react";
import CanvasDraw from "react-canvas-draw";

const Canvas = ({ onSubmit }) => {
  const canvasRef = useRef();

  const handleSubmit = () => {
    const canvasData = canvasRef.current.getDataURL(); 
    onSubmit(canvasData); 
  };

  const clearpicture = () => {
    canvasRef.current.clear();
  };

  return (
    <div>
      <CanvasDraw
        ref={canvasRef}
        brushColor="#FFFFFF"
        backgroundColor="#000000"
        canvasWidth={280}
        canvasHeight={280}
      />
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={clearpicture}>Clear</button>
    </div>
  );
};

export default Canvas;
