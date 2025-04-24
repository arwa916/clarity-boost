import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    const { id, imageUrl } = await request.json()

    if (!id || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch the image from the provided URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch original image" }, { status: 500 })
    }

    const imageBlob = await imageResponse.blob()

    // Send the image to your Python API for deblurring
    // Replace this URL with your actual Python API endpoint
    const pythonApiUrl = process.env.PYTHON_API_URL || "https://your-python-api.com/deblur"

    const formData = new FormData()
    formData.append("image", imageBlob)

    const deblurResponse = await fetch(pythonApiUrl, {
      method: "POST",
      body: formData,
    })

    if (!deblurResponse.ok) {
      return NextResponse.json({ error: "Failed to process image with Python API" }, { status: 500 })
    }

    // Get the processed image from the Python API
    const processedImageBlob = await deblurResponse.blob()

    // Upload the processed image to Vercel Blob
    const { url: processedUrl } = await put(`images/${id}/processed.jpg`, processedImageBlob, {
      access: "public",
    })

    // Store the processing result in a database or file
    // For simplicity, we're just returning the URLs directly
    // In a real app, you might want to store this in a database

    return NextResponse.json({
      success: true,
      id,
      originalUrl: imageUrl,
      processedUrl,
    })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
  }
}
