import { NextResponse } from "next/server"
import { storeImages } from "@/lib/global-storage"

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

      // TEMPORARY SOLUTION: Skip the Python API call and use the original as the "processed" image
      console.log("Using mock processing (skipping Python API)")

      // Store both the original and "processed" (same as original in this case)
      await storeImages(id, imageBlob, imageBlob)

      // Return the URLs that will serve the images
      const originalUrl = `/api/images/${id}/original`
      const processedUrl = `/api/images/${id}/processed`

      return NextResponse.json({
        success: true,
        id,
        originalUrl,
        processedUrl,
        note: "Using mock processing (Python API URL not configured)",
      })
    }

    // Send the image to your Python API for deblurring
    console.log("Sending to Python API:", pythonApiUrl)

    try {
      const formData = new FormData()
      formData.append("image", imageBlob)

      // Headers to match the Python client's request format
      const headers = {
        'Accept': 'image/png',
        'ngrok-skip-browser-warning': '1' // Include this if using ngrok
      }

      const deblurResponse = await fetch(pythonApiUrl, {
        method: "POST",
        body: formData,
        headers: headers,
      })

      if (!deblurResponse.ok) {
        console.error("Python API error:", deblurResponse.status)

        // TEMPORARY SOLUTION: If Python API fails, use the original image as fallback
        console.log("Python API failed, using original image as fallback")

        // Store both the original and "processed" (same as original in this case)
        await storeImages(id, imageBlob, imageBlob)

        // Return the URLs that will serve the images
        const originalUrl = `/api/images/${id}/original`
        const processedUrl = `/api/images/${id}/processed`

        return NextResponse.json({
          success: true,
          id,
          originalUrl,
          processedUrl,
          note: "Using original image (Python API failed)",
        })
      }

      // Get the processed image from the Python API
      // The Python API returns a PNG image directly in the response body
      const processedImageBlob = await deblurResponse.blob()
      console.log("Received processed image, size:", processedImageBlob.size, "Content-Type:", deblurResponse.headers.get("Content-Type"))

      // Store both the original and processed images
      await storeImages(id, imageBlob, processedImageBlob)

      // Return the URLs that will serve the images
      const originalUrl = `/api/images/${id}/original`
      const processedUrl = `/api/images/${id}/processed`

      return NextResponse.json({
        success: true,
        id,
        originalUrl,
        processedUrl,
      })
    } catch (pythonApiError) {
      console.error("Error calling Python API:", pythonApiError)

      // TEMPORARY SOLUTION: If Python API throws an error, use the original image as fallback
      console.log("Python API error, using original image as fallback")

      // Store both the original and "processed" (same as original in this case)
      await storeImages(id, imageBlob, imageBlob)

      // Return the URLs that will serve the images
      const originalUrl = `/api/images/${id}/original`
      const processedUrl = `/api/images/${id}/processed`

      return NextResponse.json({
        success: true,
        id,
        originalUrl,
        processedUrl,
        note: "Using original image (Python API error)",
      })
    }
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json({ error: "Failed to process image", details: String(error) }, { status: 500 })
  }
}