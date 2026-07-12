import os
import sys
import spaces
import numpy as np
import cv2
import gradio as gr
from fastapi import FastAPI
from fastapi.middleware.wsgi import WSGIMiddleware

# Insert backend directory to python path for internal imports inside backend
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_dir)

# Import backend/app.py dynamically under a custom module name to avoid conflicts with this file (app.py)
import importlib.util
backend_app_path = os.path.join(backend_dir, "app.py")
spec = importlib.util.spec_from_file_location("backend_app", backend_app_path)
backend_app = importlib.util.module_from_spec(spec)
sys.modules["backend_app"] = backend_app
spec.loader.exec_module(backend_app)

flask_app = backend_app.app

# FastAPI app is initialized below after Gradio demo is defined

# Define Gradio prediction logic using backend functions (ZeroGPU decorated)
@spaces.GPU
def predict_tbc(image):
    # Load model dynamically inside the GPU context
    local_model = backend_app.load_model_lazy()
    if local_model is None:
        return "Model could not be loaded on server. Please check startup logs.", None, None
        
    if image is None:
        return "No image provided. Please upload a chest X-ray image.", None, None

    try:
        # Gradio provides image as a numpy array in RGB format.
        # Convert RGB to BGR for opencv/gradcam compatibility
        img_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        original_h, original_w, _ = img_bgr.shape

        # Preprocess image
        img_resized = cv2.resize(img_bgr, (224, 224))
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        img_normalized = img_rgb.astype(np.float32) / 255.0
        img_array = np.expand_dims(img_normalized, axis=0)

        # Run prediction
        preds = local_model.predict(img_array)
        raw_probability = float(preds[0][0])

        if raw_probability > 0.5:
            label = "Tuberculosis"
            confidence = raw_probability * 100.0
        else:
            label = "Normal"
            confidence = (1.0 - raw_probability) * 100.0

        # Import gradcam logic to generate overlays
        from gradcam import get_gradcam_heatmap
        heatmap = get_gradcam_heatmap(img_array, local_model, last_conv_layer_name="conv5_block16_concat")

        # Resize heatmap to match the original image dimensions
        heatmap_resized = cv2.resize(heatmap, (original_w, original_h))
        heatmap_255 = np.uint8(255 * heatmap_resized)
        
        # Apply colormap
        heatmap_color = cv2.applyColorMap(heatmap_255, cv2.COLORMAP_JET)
        heatmap_color_rgb = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

        # Superimpose
        superimposed_img = cv2.addWeighted(image, 0.6, heatmap_color_rgb, 0.4, 0)

        result_text = f"Diagnosis: {label}\nConfidence: {confidence:.2f}% (probability: {raw_probability:.4f})"
        
        return result_text, heatmap_color_rgb, superimposed_img

    except Exception as e:
        return f"Error running classification: {str(e)}", None, None

# Build Gradio Interface
with gr.Blocks(title="Deteksi TBC & Grad-CAM") as demo:
    gr.Markdown("# 🫁 Deteksi Tuberkulosis (TBC) & Visualisasi Grad-CAM")
    gr.Markdown("Aplikasi demo klasifikasi penyakit Tuberkulosis dari citra X-ray dada menggunakan model DenseNet121.")
    
    with gr.Row():
        with gr.Column():
            input_image = gr.Image(label="Unggah Foto X-Ray Dada", type="numpy")
            submit_btn = gr.Button("Analisis Citra", variant="primary")
            
        with gr.Column():
            output_text = gr.Textbox(label="Hasil Diagnosis", interactive=False)
            
    with gr.Row():
        with gr.Column():
            output_heatmap = gr.Image(label="Grad-CAM Heatmap")
        with gr.Column():
            output_overlay = gr.Image(label="Overlay Citra + Heatmap")
            
    submit_btn.click(
        fn=predict_tbc,
        inputs=input_image,
        outputs=[output_text, output_heatmap, output_overlay]
    )

# 1. Initialize FastAPI app
app = FastAPI()

# 2. Mount the Flask app onto the FastAPI app at /flask-api
app.mount("/flask-api", WSGIMiddleware(flask_app))

# 3. Mount the Gradio app to the FastAPI app at root (/)
app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
