import os
import sys
import spaces
import numpy as np
import cv2
import gradio as gr

# Add backend to path so we can import gradcam utility functions
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_dir)

model = None

# Define Gradio prediction logic using backend functions (ZeroGPU decorated)
@spaces.GPU
def predict_tbc(image):
    global model
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

        MODEL_PATH = os.path.join(os.path.dirname(__file__), "model_densenet121_tbc.keras")
        print(f"Loading model from: {MODEL_PATH}")
        try:
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
            return f"Error loading model: {str(e)}", None, None

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
        preds = model.predict(img_array)
        raw_probability = float(preds[0][0])

        if raw_probability > 0.5:
            label = "Tuberculosis"
            confidence = raw_probability * 100.0
        else:
            label = "Normal"
            confidence = (1.0 - raw_probability) * 100.0

        # Import gradcam logic to generate overlays
        from gradcam import get_gradcam_heatmap
        heatmap = get_gradcam_heatmap(img_array, model, last_conv_layer_name="conv5_block16_concat")

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

if __name__ == '__main__':
    demo.launch()
