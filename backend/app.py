from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pickle
import base64
from PIL import Image
from io import BytesIO
import matplotlib.pyplot as plt
import csv
import time
from pymongo import MongoClient
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app, origins=["https://digit-reco.vercel.app"]) #frontend url

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client["finetune"]
collection = db["finetune_data"]

with open('finetuned_weights.pkl', 'rb') as f:
        params = pickle.load(f)
print('Weights and biases loaded from file.')
W1, b1, W2, b2 = params['W1'], params['b1'], params['W2'], params['b2']

def process_image(canvas_data):
    try:
        decoded = base64.b64decode(canvas_data.split(",")[1])  # Remove the "data:image/png;base64," part
        img = Image.open(BytesIO(decoded)).convert("L").resize((28, 28))  # Convert to grayscale and resize

        img_array = np.array(img)
        img_array = img_array.reshape(784, 1) / 255.0

        '''
        plt.imshow(img_array.reshape(28, 28), cmap='gray')  # Reshape to 28x28 for correct display
        plt.title("Processed Grayscale Image")
        plt.show(block=False)
        time.sleep(0.5)
        plt.close()
        '''

        return img_array.astype(np.float64)
    except Exception as e:
        print(f"Error processing image: {e}")
        return None
    
def save_image(img_array, label, file_path="../data/finetune.csv"):
    img_array = np.insert(img_array.flatten(), 0, label)
    try:
        with open(file_path, mode="a", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(img_array.flatten())
        
        print("Image data successfully saved to finetune.csv.")
    except Exception as e:
        print(f"Error saving image data: {e}")

def save_image_to_mongo(img_array, label):
    try:
        document = {
            'image': img_array.flatten().tolist(),
            'label': int(label)
        }
        collection.insert_one(document)
        print("Data successfully saved to mongo")
    except Exception as e:
        print(f'Error saving data to Mongo: {e}')


def make_prediction(X):
    print(f'X type: {type(X)}, X shape: {X.shape}')
    Z1 = W1 @ X + b1
    print('z1 done')
    A1 = np.maximum(Z1, 0) #relu activation
    print('a1 done')
    Z2 = W2 @ A1 + b2
    print('z2 done')
    A2 = np.exp(Z2) / np.sum(np.exp(Z2), axis=0)
    print('a2 done')
    print("Prediciton: ", np.argmax(A2, axis=0)[0])
    return np.argmax(A2, axis=0)[0]

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json["canvasData"]
    X = process_image(data)
    prediction = make_prediction(X) 
    return jsonify({"prediction": int(prediction)})

@app.route("/update-label", methods=["POST"])
def update_label():
    data = request.json
    prediction = data["prediction"]
    actual_label = data["actualLabel"]
    X = process_image(data["canvasData"])
    label_to_save = prediction if data["isCorrect"] else actual_label
    save_image_to_mongo(X, label_to_save)
    return jsonify({"message": "Label updated successfully!"})

if __name__ == "__main__":
    #app.run(port=8000)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
