import { NextResponse } from "next/server"

export async function GET(
    request: Request,
    context: { params: { id: string } }
) {
  try {
    // First await the entire params object
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 })
    }

    // In a real application, you would fetch the processing result from a database
    // For this example, we're constructing the URLs based on the ID pattern

    const originalUrl = `/api/images/${id}/original`
    const processedUrl = `/api/images/${id}/processed`

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