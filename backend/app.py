import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from gradcam import process_and_predict
import numpy as np
import cv2

app = Flask(__name__)
# Enable CORS for all origins (especially useful for localhost frontend / vercel deploys)
CORS(app)

# Lazy model loading logic
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model_densenet121_tbc.keras")
model = None
model_loaded = False

def load_model_lazy():
    global model, model_loaded
    if model is None:
        import tensorflow as tf
        import keras
        
        # Monkey-patch Keras to support loading models saved in newer Keras versions (like 3.15.0) on older Keras (like 3.12.3)
        try:
            original_layer_init = keras.layers.Layer.__init__
            def patched_layer_init(self, *args, **kwargs):
                kwargs.pop('quantization_config', None)
                original_layer_init(self, *args, **kwargs)
            keras.layers.Layer.__init__ = patched_layer_init
            print("Keras Layer.__init__ successfully patched for quantization_config compatibility.")
        except Exception as e:
            print(f"Failed to patch Keras Layer: {e}")

        print(f"Loading model from: {MODEL_PATH}")
        try:
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Model loaded successfully.")
            model_loaded = True
        except Exception as e:
            print(f"Error loading model: {e}")
            model = None
            model_loaded = False
    return model

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": model_loaded or os.path.exists(MODEL_PATH)
    })

@app.route('/predict', methods=['POST'])
def predict():
    global model
    model = load_model_lazy()
    if model is None:
        return jsonify({"error": "Model could not be loaded on server."}), 500

    if 'image' not in request.files:
        return jsonify({"error": "No image field in request."}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected."}), 400

    try:
        image_bytes = file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            return jsonify({"error": "Invalid image format."}), 400

        # Preprocess and predict
        img_resized = cv2.resize(img_bgr, (224, 224))
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        img_normalized = img_rgb.astype(np.float32) / 255.0
        img_array = np.expand_dims(img_normalized, axis=0)

        preds = model.predict(img_array)
        raw_probability = float(preds[0][0])

        if raw_probability > 0.5:
            label = "Tuberculosis"
            confidence = raw_probability * 100.0
        else:
            label = "Normal"
            confidence = (1.0 - raw_probability) * 100.0

        return jsonify({
            "label": label,
            "confidence": round(confidence, 2),
            "raw_probability": round(raw_probability, 4)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict-gradcam', methods=['POST'])
def predict_gradcam():
    global model
    model = load_model_lazy()
    if model is None:
        return jsonify({"error": "Model could not be loaded on server."}), 500

    if 'image' not in request.files:
        return jsonify({"error": "No image field in request."}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected."}), 400

    try:
        image_bytes = file.read()
        # process_and_predict handles the full prediction and gradcam overlay logic
        result = process_and_predict(image_bytes, model, last_conv_layer_name="conv5_block16_concat")
        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Run server on port specified by environment variable, default to 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
