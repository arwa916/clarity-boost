import { NextResponse } from "next/server";
import { getStorageStats, hasImage } from "@/lib/global-storage";

// This endpoint is for debugging purposes only
// In a production app, you would remove this or add authentication
export async function GET(request: Request) {
    try {
        // Get the URL object from the request
        const url = new URL(request.url);

        // Check if a specific ID was provided
        const id = url.searchParams.get('id');

        // If an ID was provided, check if it exists in storage
        if (id) {
            const exists = hasImage(id);
            return NextResponse.json({
                message: `Image with ID ${id} ${exists ? 'exists' : 'does not exist'} in storage`,
                exists
            });
        }

        // Otherwise, get general storage statistics
        const stats = getStorageStats();

        return NextResponse.json({
            stats,
            message: `Storage currently contains ${stats.count} images, using approximately ${Math.round(stats.totalSize / 1024)} KB of memory`
        });
    } catch (error) {
        console.error("Error in debug endpoint:", error);
        return NextResponse.json({ error: "Failed to get storage information" }, { status: 500 });
    }
}