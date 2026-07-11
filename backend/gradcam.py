import numpy as np
import tensorflow as tf
import cv2
import base64
from io import BytesIO
from PIL import Image

def get_gradcam_heatmap(img_array, model, last_conv_layer_name="conv5_block16_concat"):
    """
    Computes the Grad-CAM heatmap for a given input image array and Keras model.
    """
    # Create a model that maps the inputs to the last conv layer output and predictions
    grad_model = tf.keras.models.Model(
        inputs=[model.inputs],
        outputs=[model.get_layer(last_conv_layer_name).output, model.output]
    )

    with tf.GradientTape() as tape:
        last_conv_layer_output, preds = grad_model(img_array)
        # Target probability output (shape is [None, 1])
        class_output = preds[:, 0]

    # Gradient of the prediction with respect to output feature map of the last conv layer
    grads = tape.gradient(class_output, last_conv_layer_output)

    # Global average pooling of gradients
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight the channels of the last conv layer output by the pooled gradients
    last_conv_layer_output = last_conv_layer_output[0]
    heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # ReLU and normalization
    heatmap = tf.maximum(heatmap, 0)
    max_val = tf.reduce_max(heatmap)
    if max_val == 0:
        max_val = 1e-10
    heatmap = heatmap / max_val
    return heatmap.numpy()

def process_and_predict(image_bytes, model, last_conv_layer_name="conv5_block16_concat"):
    """
    Runs prediction and generates Grad-CAM base64 images.
    """
    # Load image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image bytes.")

    original_h, original_w, _ = img_bgr.shape

    # Preprocess image (Resize to 224x224 and scale to [0, 1] as standard DenseNet input scaling)
    img_resized = cv2.resize(img_bgr, (224, 224))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    img_normalized = img_rgb.astype(np.float32) / 255.0
    img_array = np.expand_dims(img_normalized, axis=0)

    # Predict
    preds = model.predict(img_array)
    raw_probability = float(preds[0][0])

    # Interpret predictions
    # threshold 0.5: > 0.5 represents Tuberculosis, <= 0.5 represents Normal
    if raw_probability > 0.5:
        label = "Tuberculosis"
        confidence = raw_probability * 100.0
    else:
        label = "Normal"
        confidence = (1.0 - raw_probability) * 100.0

    # Generate Heatmap
    heatmap = get_gradcam_heatmap(img_array, model, last_conv_layer_name)

    # Resize heatmap to match the original image dimensions
    heatmap_resized = cv2.resize(heatmap, (original_w, original_h))
    
    # Scale heatmap to 0-255
    heatmap_255 = np.uint8(255 * heatmap_resized)

    # Apply JET colormap to get a colored heatmap
    heatmap_color = cv2.applyColorMap(heatmap_255, cv2.COLORMAP_JET)
    heatmap_color_rgb = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    # Superimpose the heatmap on the original image
    # Note: original image needs to be in RGB
    original_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    superimposed_img = cv2.addWeighted(original_rgb, 0.6, heatmap_color_rgb, 0.4, 0)

    # Convert to PIL images to save to base64
    heatmap_pil = Image.fromarray(heatmap_color_rgb)
    superimposed_pil = Image.fromarray(superimposed_img)

    # Encode to base64
    buffered_heatmap = BytesIO()
    heatmap_pil.save(buffered_heatmap, format="PNG")
    heatmap_base64 = "data:image/png;base64," + base64.b64encode(buffered_heatmap.getvalue()).decode('utf-8')

    buffered_superimposed = BytesIO()
    superimposed_pil.save(buffered_superimposed, format="PNG")
    superimposed_base64 = "data:image/png;base64," + base64.b64encode(buffered_superimposed.getvalue()).decode('utf-8')

    return {
        "label": label,
        "confidence": round(confidence, 2),
        "raw_probability": round(raw_probability, 4),
        "heatmap_image": heatmap_base64,
        "superimposed_image": superimposed_base64
    }
