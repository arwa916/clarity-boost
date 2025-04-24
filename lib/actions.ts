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
    console.log("Generated ID:", id)

    // Upload the original image to Vercel Blob
    console.log("Uploading to Vercel Blob...")
    const { url } = await put(`images/${id}/original.jpg`, file, {
      access: "public",
    })
    console.log("Upload successful, URL:", url)

    // Send the image to your Python API for processing
    console.log("Sending to deblur API...")
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
      const errorData = await response.json().catch(() => ({}))
      console.error("API response not OK:", response.status, errorData)
      throw new Error(`Failed to process image: ${response.status} ${JSON.stringify(errorData)}`)
    }

    const result = await response.json()
    console.log("Processing successful:", result)

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
