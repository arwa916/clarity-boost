import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: Request) {
  try {
    const { id, imageUrl } = await request.json()
    console.log("Received deblur request for ID:", id)

    if (!id || !imageUrl) {
      console.error("Missing required fields:", { id, imageUrl })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch the image from the provided URL
    console.log("Fetching original image from:", imageUrl)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      console.error("Failed to fetch original image:", imageResponse.status)
      return NextResponse.json({ error: "Failed to fetch original image" }, { status: 500 })
    }

    const imageBlob = await imageResponse.blob()
    console.log("Image fetched successfully, size:", imageBlob.size)

    // Check if Python API URL is configured
    const pythonApiUrl = process.env.PYTHON_API_URL
    if (!pythonApiUrl) {
      console.error("PYTHON_API_URL environment variable is not set")

      // TEMPORARY SOLUTION: Skip the Python API call and create a mock processed image
      // In a real app, you would remove this and ensure the Python API is working
      console.log("Using mock processing (skipping Python API)")

      // Upload the original image as the "processed" image for testing
      const { url: processedUrl } = await put(`images/${id}/processed.jpg`, imageBlob, {
        access: "public",
      })

      console.log("Mock processing complete, URL:", processedUrl)

      return NextResponse.json({
        success: true,
        id,
        originalUrl: imageUrl,
        processedUrl,
        note: "Using mock processing (Python API URL not configured)",
      })
    }

    // Send the image to your Python API for deblurring
    console.log("Sending to Python API:", pythonApiUrl)

    try {
      const formData = new FormData()
      formData.append("image", imageBlob)

      const deblurResponse = await fetch(pythonApiUrl, {
        method: "POST",
        body: formData,
      })

      if (!deblurResponse.ok) {
        console.error("Python API error:", deblurResponse.status)

        // TEMPORARY SOLUTION: If Python API fails, use the original image as fallback
        console.log("Python API failed, using original image as fallback")

        const { url: processedUrl } = await put(`images/${id}/processed.jpg`, imageBlob, {
          access: "public",
        })

        return NextResponse.json({
          success: true,
          id,
          originalUrl: imageUrl,
          processedUrl,
          note: "Using original image (Python API failed)",
        })
      }

      // Get the processed image from the Python API
      const processedImageBlob = await deblurResponse.blob()
      console.log("Received processed image, size:", processedImageBlob.size)

      // Upload the processed image to Vercel Blob
      const { url: processedUrl } = await put(`images/${id}/processed.jpg`, processedImageBlob, {
        access: "public",
      })
      console.log("Uploaded processed image, URL:", processedUrl)

      return NextResponse.json({
        success: true,
        id,
        originalUrl: imageUrl,
        processedUrl,
      })
    } catch (pythonApiError) {
      console.error("Error calling Python API:", pythonApiError)

      // TEMPORARY SOLUTION: If Python API throws an error, use the original image as fallback
      console.log("Python API error, using original image as fallback")

      const { url: processedUrl } = await put(`images/${id}/processed.jpg`, imageBlob, {
        access: "public",
      })

      return NextResponse.json({
        success: true,
        id,
        originalUrl: imageUrl,
        processedUrl,
        note: "Using original image (Python API error)",
      })
    }
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json({ error: "Failed to process image", details: String(error) }, { status: 500 })
  }
}
