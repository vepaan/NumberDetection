const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const math = require('mathjs');
const { createCanvas, loadImage } = require("canvas");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/finetune";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const finetuneSchema = new mongoose.Schema({
  image: [Number], // Store pixel values as an array of numbers
  label: Number,
});
const Finetune = mongoose.model("Finetune", finetuneSchema);

// Load Weights and Biases
let weights = {};
try {
  const weightsPath = path.join(__dirname, "finetuned_weights.json"); // Converted to JSON for Node.js compatibility
  weights = JSON.parse(fs.readFileSync(weightsPath, "utf8"));
  console.log("Weights and biases loaded successfully.");
} catch (error) {
  console.error("Error loading weights:", error);
}

// Helper Function: Process Image Data
const processImage = async (canvasData) => {
  try {
    const base64Data = canvasData.split(",")[1]; // Remove "data:image/png;base64,"
    const buffer = Buffer.from(base64Data, "base64");

    const img = await loadImage(buffer);
    const canvas = createCanvas(28, 28);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, 28, 28);

    const imgArray = [];
    const imageData = ctx.getImageData(0, 0, 28, 28).data;

    for (let i = 0; i < imageData.length; i += 4) {
      // Extract grayscale value
      const grayscale = imageData[i] / 255; // Normalize to [0, 1]
      imgArray.push(grayscale);
    }
    return imgArray;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

// Helper Function: Make Prediction
const makePrediction = (imgArray) => {
  try {
    const W1 = weights.W1;
    const b1 = weights.b1;
    const W2 = weights.W2;
    const b2 = weights.b2;

    // Convert arrays to matrices (using math.js for matrix operations)
    const Z1 = math.add(math.multiply(W1, imgArray), b1);
    const A1 = Z1.map((z) => Math.max(z, 0)); // ReLU activation
    const Z2 = math.add(math.multiply(W2, A1), b2);
    const A2 = math.exp(Z2).map((z) => z / math.sum(math.exp(Z2))); // Softmax activation
    const prediction = A2.indexOf(Math.max(...A2));
    return prediction;
  } catch (error) {
    console.error("Error during prediction:", error);
    throw error;
  }
};

// Route: Predict
app.post("/predict", async (req, res) => {
  try {
    const { canvasData } = req.body;
    const imgArray = await processImage(canvasData);
    const prediction = makePrediction(imgArray);
    res.json({ prediction });
  } catch (error) {
    res.status(500).json({ error: "Error processing prediction." });
  }
});

// Route: Update Label
app.post("/update-label", async (req, res) => {
  try {
    const { canvasData, prediction, actualLabel, isCorrect } = req.body;
    const imgArray = await processImage(canvasData);
    const labelToSave = isCorrect ? prediction : actualLabel;

    // Save to MongoDB
    const newImage = new Finetune({ image: imgArray, label: labelToSave });
    await newImage.save();

    // Save to CSV
    const csvData = [labelToSave, ...imgArray].join(",") + "\n";
    fs.appendFileSync(path.join(__dirname, "../data/finetune.csv"), csvData);

    res.json({ message: "Label updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error updating label." });
  }
});

// Start Server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
