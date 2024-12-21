const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const sharp = require('sharp'); // For image processing
const fs = require('fs');
const math = require('mathjs');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Mongoose Schema for storing image data
const ImageDataSchema = new mongoose.Schema({
  image: [Number],
  label: Number,
});
const ImageData = mongoose.model('ImageData', ImageDataSchema);

// Load weights and biases
let weights;
try {
  weights = JSON.parse(fs.readFileSync('./weights/weights.json', 'utf-8'));
  console.log('Weights and biases loaded from JSON file.');
} catch (err) {
  console.error('Error loading weights:', err);
}

// Destructure weights for convenience
const { W1, b1, W2, b2 } = weights || {};

// Helper functions for prediction
const relu = (array) => math.map(array, (val) => Math.max(0, val));

function softmax(Z) {
  const exps = math.map(Z, (value) => math.exp(value)); // Apply exp elementwise
  const sum = math.sum(exps); // Sum all elements
  return math.map(exps, (value) => value / sum); // Normalize
}

// Custom argMax function
function argMax(array) {
    const plainArray = Array.isArray(array) ? array : array.toArray(); // Convert to plain array if necessary
    return plainArray.reduce(
      (maxIndex, currentValue, currentIndex, arr) =>
        currentValue > arr[maxIndex] ? currentIndex : maxIndex,
      0
    );
  }
  

const makePrediction = (X) => {
try {
    if (!W1 || !b1 || !W2 || !b2) {
    throw new Error('Model weights are not loaded properly.');
    }
    console.log('Input data (X):', X);
    const Z1 = math.add(math.multiply(W1, X), b1);
    console.log('Z1:', Z1);
    const A1 = relu(Z1);
    console.log('A1 (ReLU):', A1);
    const Z2 = math.add(math.multiply(W2, A1), b2);
    console.log('Z2:', Z2);
    const A2 = softmax(Z2).toArray(); // Ensure A2 is a plain array
    console.log('A2 (Softmax):', A2);
    const prediction = argMax(A2); // Using fixed argMax
    console.log('Prediction:', prediction);
    return prediction;
} catch (err) {
    console.error('Error in makePrediction:', err);
    throw new Error('Prediction calculation failed.');
}
};


// Process image to convert into normalized pixel array
const processImage = async (canvasData) => {
  try {
    const base64Data = canvasData.split(',')[1]; // Remove the "data:image/png;base64,"
    const buffer = Buffer.from(base64Data, 'base64');
    const resizedBuffer = await sharp(buffer)
      .resize(28, 28)
      .grayscale()
      .raw()
      .toBuffer();
    const normalizedArray = Array.from(resizedBuffer).map((pixel) => pixel / 255.0); // Normalize pixel values
    console.log('Processed Image (Normalized):', normalizedArray);
    return normalizedArray;
  } catch (err) {
    console.error('Error processing image:', err);
    return null;
  }
};

// Routes

// Prediction endpoint
app.post('/predict', async (req, res) => {
  const { canvasData } = req.body;

  if (!canvasData) {
    return res.status(400).json({ error: 'Missing canvas data.' });
  }

  // Process the canvas data
  const imgArray = await processImage(canvasData);

  if (!imgArray) {
    return res.status(400).json({ error: 'Invalid image data' });
  }

  try {
    const prediction = makePrediction(math.matrix(imgArray));
    res.json({ prediction });
  } catch (error) {
    console.error('Error during prediction:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// Update label endpoint
app.post('/update-label', async (req, res) => {
  const { canvasData, actualLabel, prediction, isCorrect } = req.body;

  if (!canvasData || actualLabel == null || prediction == null) {
    return res.status(400).json({ error: 'Missing required data fields.' });
  }

  // Process the canvas data
  const imgArray = await processImage(canvasData);

  if (!imgArray) {
    return res.status(400).json({ error: 'Invalid image data' });
  }

  // Determine the label to save
  const labelToSave = isCorrect ? prediction : actualLabel;

  // Save to MongoDB
  const imageData = new ImageData({
    image: imgArray,
    label: labelToSave,
  });

  try {
    await imageData.save();
    console.log('Data successfully saved to MongoDB');
    res.json({ message: 'Label updated successfully!' });
  } catch (err) {
    console.error('Error saving data to MongoDB:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
