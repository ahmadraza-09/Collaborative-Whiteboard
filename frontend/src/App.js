import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

const App = () => {
  const [sessionID, setSessionID] = useState('');
  const [connected, setConnected] = useState(false);
  const canvasRef = useRef(null);
  const ws = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('black'); // Default drawing color
  const [thickness, setThickness] = useState(2); // Default thickness
  const lastPosition = useRef({ x: 0, y: 0 });

  const startDrawing = (event) => {
    const { clientX, clientY } = event;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    setIsDrawing(true);
    lastPosition.current.x = offsetX;
    lastPosition.current.y = offsetY;
  };

  const draw = (event) => {
    if (!isDrawing) return;

    const { clientX, clientY } = event;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    const context = canvas.getContext('2d');

    context.strokeStyle = drawingColor; // Set the drawing color
    context.lineWidth = thickness; // Set the thickness
    context.lineCap = 'round';
    context.lineJoin = 'round';

    context.beginPath();
    context.moveTo(lastPosition.current.x, lastPosition.current.y);
    context.lineTo(offsetX, offsetY);
    context.stroke();

    lastPosition.current.x = offsetX;
    lastPosition.current.y = offsetY;
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const drawLine = (line) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    context.strokeStyle = line.color; // Use the color provided in the line payload
    context.lineWidth = line.thickness; // Use the thickness provided in the line payload
    context.lineCap = 'round';
    context.lineJoin = 'round';

    context.beginPath();
    context.moveTo(line.startX, line.startY);
    context.lineTo(line.endX, line.endY);
    context.stroke();
  };

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5000');

    ws.current.onopen = () => {
      console.log('Connected to server');
    };

    ws.current.onmessage = (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case 'drawing':
          drawLine(data.payload);
          break;
        default:
          break;
      }
    };

    ws.current.onclose = () => {
      console.log('Connection closed');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current.close();
    };
  }, [drawLine]);

  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseleave', endDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', endDrawing);
      canvas.removeEventListener('mouseleave', endDrawing);
    };
  }, [canvasRef, draw, endDrawing]);

  const joinSession = () => {
    const newSessionID = uuidv4();
    setSessionID(newSessionID);
    ws.current.send(JSON.stringify({ type: 'join', sessionID: newSessionID }));
    setConnected(true);
  };

  const toggleEraser = () => {
    // Toggle between drawing color and background color to simulate erasing
    setDrawingColor((prevColor) =>
      prevColor === 'black' ? 'white' : 'black'
    );
  };

  const increaseThickness = () => {
    setThickness((prevThickness) => prevThickness + 1);
  };

  const decreaseThickness = () => {
    setThickness((prevThickness) => Math.max(1, prevThickness - 1));
  };

  return (
    <div className="App">
      <div className="toolbar">
        {!connected ? (
          <button onClick={joinSession}>Join Session</button>
        ) : (
          <span>Connected to session: {sessionID}</span>
        )}
        <button onClick={toggleEraser}>
          {drawingColor === 'black' ? 'Eraser' : 'Pencil'}
        </button>
        <button onClick={increaseThickness}>Increase Thickness</button>
        <button onClick={decreaseThickness}>Decrease Thickness</button>
      </div>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ border: '1px solid #000' }}
        ></canvas>
      </div>
    </div>
  );
};

export default App;
