const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/predict', async (req, res) => {
    const {canvasData} = req.body;
    try{
        const response = await axios.post("http://localhost:8000/predict", {
            canvasData,
        });

        const prediction = response.data.prediction;
        res.json({prediction});
    } catch(error) {
        console.error(error);
        res.status(500).json({error: "Error processing the prediction!!!"});
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));