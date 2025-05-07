import { NextResponse } from "next/server"
import { storeImages } from "@/lib/vercel-blob-storage"

export async function POST(request: Request) {
    try {
        // Get the form data from the request
        const formData = await request.formData()
        const image = formData.get("image") as File
        const id = formData.get("id") as string

        if (!id || !image) {
            console.error("[DEBLUR-API] Missing required fields:", { id, image })
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        console.log("[DEBLUR-API] Processing image for ID:", id, "Image size:", image.size)

        // Check if Python API URL is configured
        const pythonApiUrl = process.env.PYTHON_API_URL
        if (!pythonApiUrl) {
            console.error("[DEBLUR-API] PYTHON_API_URL environment variable is not set")

            // TEMPORARY SOLUTION: Create a mock processed image
            // In a real app, you would ensure the Python API is working
            console.log("[DEBLUR-API] Using mock processing (skipping Python API)")

            // Store both the original and processed (original in this case) images
            await storeImages(id, image, image)

            // Generate URLs for client
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

        // Send the image directly to your Python API for deblurring
        console.log("[DEBLUR-API] Sending to Python API:", pythonApiUrl)

        try {
            // Create a new FormData to send to the Python API - matching the Python client format
            const apiFormData = new FormData()
            apiFormData.append("image", image)

            // Headers to match the Python client's request format
            const headers = {
                'Accept': 'image/png',
                'ngrok-skip-browser-warning': '1' // Include this if using ngrok
            }

            const deblurResponse = await fetch(pythonApiUrl, {
                method: "POST",
                body: apiFormData,
                headers: headers,
            })

            if (!deblurResponse.ok) {
                console.error("[DEBLUR-API] Python API error:", deblurResponse.status)

                // TEMPORARY SOLUTION: If Python API fails, use the original image as fallback
                console.log("[DEBLUR-API] Python API failed, using original image as fallback")

                // Store both the original and processed (original in this case) images
                await storeImages(id, image, image)

                // Generate URLs for client
                const originalUrl = `/api/images/${id}/original`
                const processedUrl = `/api/images/${id}/processed` // Same as original in this case

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
            console.log("[DEBLUR-API] Received processed image, size:", processedImageBlob.size, "Content-Type:", deblurResponse.headers.get("Content-Type"))

            // Store both the original and processed images in Vercel Blob
            await storeImages(id, image, processedImageBlob)

            // Generate URLs for client
            const originalUrl = `/api/images/${id}/original`
            const processedUrl = `/api/images/${id}/processed`

            return NextResponse.json({
                success: true,
                id,
                originalUrl,
                processedUrl,
            })
        } catch (pythonApiError) {
            console.error("[DEBLUR-API] Error calling Python API:", pythonApiError)

            // TEMPORARY SOLUTION: If Python API throws an error, use the original image as fallback
            console.log("[DEBLUR-API] Python API error, using original image as fallback")

            // Store both the original and processed (original in this case) images
            await storeImages(id, image, image)

            // Generate URLs for client
            const originalUrl = `/api/images/${id}/original`
            const processedUrl = `/api/images/${id}/processed` // Same as original in this case

            return NextResponse.json({
                success: true,
                id,
                originalUrl,
                processedUrl,
                note: "Using original image (Python API error)",
            })
        }
    } catch (error) {
        console.error("[DEBLUR-API] Error processing image:", error)
        return NextResponse.json({ error: "Failed to process image", details: String(error) }, { status: 500 })
    }
}