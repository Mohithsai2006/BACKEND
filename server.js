const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.static('uploads'));
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/dbconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const analysisSchema = new mongoose.Schema({
  filename: String,
  emotions: Object,
  dominant_emotion: {
    emotion: String,
    score: Number
  }
});
const Analysis = mongoose.model('Analysis', analysisSchema);

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post('/upload-folder', upload.array('photos'), async (req, res) => {
  const files = req.files;
  const analysisResults = [];

  for (const file of files) {
    const filename = file.filename;

    try {
      const flaskServerUrl = 'http://localhost:5000/analyze';
      const response = await axios.post(flaskServerUrl, { filename });

      const analysisData = response.data;

      const analysis = new Analysis({
        filename: filename,
        emotions: analysisData.emotions,
        dominant_emotion: analysisData.dominant_emotion
      });
      await analysis.save();

      analysisResults.push({
        filename: filename,
        emotions: analysisData.emotions,
        dominant_emotion: analysisData.dominant_emotion
      });

    } catch (error) {
      console.error(`Error analyzing file ${filename}:`, error.response ? error.response.data : error.message);
      analysisResults.push({
        filename: filename,
        error: `Failed to analyze: ${error.message}`
      });
    }
  }

  res.json(analysisResults);
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Node.js server running on port ${PORT}`);
});
