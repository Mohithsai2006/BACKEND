from flask import Flask, request, jsonify
import os
import cv2
from deepface import DeepFace
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze_emotion():
    data = request.get_json()
    filename = data.get('filename')

    file_path = os.path.join("uploads", filename)
    img = cv2.imread(file_path)

    if img is None:
        return jsonify({"error": f"Invalid image file: {filename}"}), 400

    try:
        result = DeepFace.analyze(img, actions=['emotion'], detector_backend='opencv', enforce_detection=False)
        
        if not result:
            return jsonify({"error": "No face detected in the image"}), 400

        emotions = result[0]['emotion']
        max_emotion = max(emotions, key=emotions.get)

        return jsonify({
            "emotions": emotions,
            "dominant_emotion": {
                "emotion": max_emotion,
                "score": emotions[max_emotion]
            }
        }), 200

    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
