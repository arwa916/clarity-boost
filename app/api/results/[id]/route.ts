import { NextResponse } from "next/server"

// In a real application, you would fetch this data from a database
// For this example, we're constructing the URLs based on the ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 })
    }

    // In a real application, you would fetch the processing result from a database
    // For this example, we're constructing the URLs based on the ID pattern

    // This is a simplified example - in a real app, you would check if these files exist
    const originalUrl = `${process.env.NEXT_PUBLIC_VERCEL_BLOB_URL || "https://public.blob.vercel-storage.com"}/images/${id}/original.jpg`
    const processedUrl = `${process.env.NEXT_PUBLIC_VERCEL_BLOB_URL || "https://public.blob.vercel-storage.com"}/images/${id}/processed.jpg`

    return NextResponse.json({
      id,
      originalUrl,
      processedUrl,
    })
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}
