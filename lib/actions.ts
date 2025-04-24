"use client"

// Type definitions
export interface ProcessedImageResult {
  id: string;
  originalImage: Blob | null;
  processedImage: Blob | null;
  originalUrl: string;
  processedUrl: string;
}

// Function to send image directly to deblurring API
export async function uploadImage(file: File): Promise<{ id: string }> {
  try {
    // Generate a unique ID for this processing job
    const id = crypto.randomUUID();
    console.log("Generated ID:", id);

    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append("image", file);
    formData.append("id", id);

    // Send the image directly to the deblurring API
    console.log("Sending to deblur API...");
    const response = await fetch("/api/deblur/direct", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API response not OK:", response.status, errorData);
      throw new Error(`Failed to process image: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log("Processing successful:", result);

    return { id };
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
}

// Function to get the processed image results
export async function getProcessedImage(id: string): Promise<ProcessedImageResult> {
  try {
    const response = await fetch(`/api/results/${id}`);

    if (!response.ok) {
      throw new Error("Failed to fetch processed image");
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getProcessedImage:", error);
    throw error;
  }
}