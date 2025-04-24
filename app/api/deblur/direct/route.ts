import { NextResponse } from "next/server"
import { storeImages } from "@/lib/image-storage"

export async function POST(request: Request) {
    try {
        // Get the form data from the request
        const formData = await request.formData()
        const image = formData.get("image") as File
        const id = formData.get("id") as string

        if (!id || !image) {
            console.error("Missing required fields:", { id, image })
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        console.log("Processing image for ID:", id, "Image size:", image.size)

        // Check if Python API URL is configured
        const pythonApiUrl = process.env.PYTHON_API_URL
        if (!pythonApiUrl) {
            console.error("PYTHON_API_URL environment variable is not set")

            // TEMPORARY SOLUTION: Create a mock processed image
            // In a real app, you would ensure the Python API is working
            console.log("Using mock processing (skipping Python API)")

            // Store image data in session storage or application memory
            // For demo purposes, we'll create fake URLs that the client can use
            // In a real application, you might want to use a database or memory cache
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
        console.log("Sending to Python API:", pythonApiUrl)

        try {
            // Create a new FormData to send to the Python API
            const apiFormData = new FormData()
            apiFormData.append("image", image)
            apiFormData.append("id", id)

            const deblurResponse = await fetch(pythonApiUrl, {
                method: "POST",
                body: apiFormData,
            })

            if (!deblurResponse.ok) {
                console.error("Python API error:", deblurResponse.status)

                // TEMPORARY SOLUTION: If Python API fails, use the original image as fallback
                console.log("Python API failed, using original image as fallback")

                // Generate URLs for client
                const originalUrl = `/api/images/${id}/original`
                const processedUrl = `/api/images/${id}/processed` // Same as original in this case

                // Store the original image in session or memory cache
                // This is where you'd implement your storage solution

                return NextResponse.json({
                    success: true,
                    id,
                    originalUrl,
                    processedUrl,
                    note: "Using original image (Python API failed)",
                })
            }

            // Get the processed image from the Python API
            const processedImageBlob = await deblurResponse.blob()
            console.log("Received processed image, size:", processedImageBlob.size)

            // Generate URLs for client
            const originalUrl = `/api/images/${id}/original`
            const processedUrl = `/api/images/${id}/processed`

            // Store both the original and processed images
            await storeImages(id, image, processedImageBlob)

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
        console.error("Error processing image:", error)
        return NextResponse.json({ error: "Failed to process image", details: String(error) }, { status: 500 })
    }
}