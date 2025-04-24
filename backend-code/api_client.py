import io

import requests
import sys
from PIL import Image
import matplotlib.pyplot as plt
import numpy as np


def deblur_image(image_path, api_url="http://localhost:3000/deblur"):
    """
    Send an image to the deblurring API and save the result

    Args:
        image_path: Path to the input image
        api_url: URL of the deblurring API endpoint

    Returns:
        The deblurred image as a PIL Image object
    """
    # Open the image file
    with open(image_path, 'rb') as file:
        # Prepare the file for the request
        files = {'image': file}

        # Send the request to the API
        print(f"Sending request to {api_url}...")
        response = requests.post(api_url, files=files)

    # Check if request was successful
    if response.status_code == 200:
        print("Request successful!")
        # Create a PIL Image from the response content
        deblurred_img = Image.open(io.BytesIO(response.content))
        return deblurred_img
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None


def display_comparison(original_path, deblurred_img):
    """Display the original and deblurred images side by side"""
    original_img = Image.open(original_path)

    # Create a figure with two subplots
    fig, axes = plt.subplots(1, 2, figsize=(12, 6))

    # Display original image
    axes[0].imshow(np.array(original_img))
    axes[0].set_title('Original (Blurred) Image')
    axes[0].axis('off')

    # Display deblurred image
    axes[1].imshow(np.array(deblurred_img))
    axes[1].set_title('Deblurred Image')
    axes[1].axis('off')

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python client.py <image_path> [api_url]")
        sys.exit(1)

    image_path = sys.argv[1]
    api_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:3000/deblur"

    deblurred_img = deblur_image(image_path, api_url)

    if deblurred_img:
        # Save the deblurred image
        output_path = image_path.rsplit('.', 1)[0] + "_deblurred.png"
        deblurred_img.save(output_path)
        print(f"Deblurred image saved to {output_path}")

        # Display comparison
        try:
            display_comparison(image_path, deblurred_img)
        except Exception as e:
            print(f"Could not display comparison: {e}")
