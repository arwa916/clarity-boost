from flask import Flask, request, send_file, jsonify
import numpy as np
from PIL import Image
import io
import os
import tensorflow as tf

from model import generator_model
import data_utils

app = Flask(__name__)

# Load the model at startup to avoid loading it for each request
print("Loading deblurring model...")
model = generator_model()
model_path = 'weight/generator_weights.h5'

if os.path.exists(model_path):
    model.load_weights(model_path)
    print(f"Model loaded from {model_path}")
else:
    print(f"Warning: Model weights not found at {model_path}!")


@app.route('/deblur', methods=['POST'])
def deblur_image():
    # Check if an image was sent
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    file = request.files['image']

    try:
        # Read and preprocess the image
        img = Image.open(file.stream)

        # Resize to expected input size if necessary
        if img.size != (256, 256):
            img = img.resize((256, 256), Image.LANCZOS)

        # Convert to numpy array
        img_array = np.array(img).astype(np.float32)

        # Handle grayscale images by converting to RGB
        if len(img_array.shape) == 2:
            img_array = np.stack([img_array] * 3, axis=-1)

        # Normalize
        img_array = data_utils.normalization(img_array)

        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)

        # Run inference
        deblurred = model.predict(img_array)

        # Convert back to image format
        deblurred = deblurred * 127.5 + 127.5
        deblurred = deblurred[0].astype(np.uint8)

        # Convert to PIL Image and save to memory buffer
        output_img = Image.fromarray(deblurred)
        img_io = io.BytesIO()
        output_img.save(img_io, 'PNG')
        img_io.seek(0)

        # Return the image
        return send_file(img_io, mimetype='image/png')

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_loaded': os.path.exists(model_path)})


if __name__ == '__main__':
    # Set to use CPU or limit GPU memory to avoid TF taking all GPU memory
    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
        try:
            # Currently, memory growth needs to be the same across GPUs
            for gpu in gpus:
                tf.config.experimental.set_memory_growth(gpu, True)
        except RuntimeError as e:
            print(e)

    app.run(host='0.0.0.0', port=8081, debug=False)
