"use client"

import { put } from "@vercel/blob"

// Type definitions
export interface ProcessedImageResult {
  id: string
  originalUrl: string
  processedUrl: string
}

// Function to upload image to Vercel Blob and send to deblurring API
export async function uploadImage(file: File): Promise<{ id: string }> {
  try {
    // Generate a unique ID for this processing job
    const id = crypto.randomUUID()

    // Upload the original image to Vercel Blob
    const { url } = await put(`images/${id}/original.jpg`, file, {
      access: "public",
    })

    // Send the image to your Python API for processing
    const response = await fetch("/api/deblur", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
        imageUrl: url,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to process image")
    }

    return { id }
  } catch (error) {
    console.error("Error in uploadImage:", error)
    throw error
  }
}

// Function to get the processed image results
export async function getProcessedImage(id: string): Promise<ProcessedImageResult> {
  try {
    const response = await fetch(`/api/results/${id}`)

    if (!response.ok) {
      throw new Error("Failed to fetch processed image")
    }

    return await response.json()
  } catch (error) {
    console.error("Error in getProcessedImage:", error)
    throw error
  }
}
