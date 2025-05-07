import { NextResponse } from "next/server";
import { cleanupImage, getStorageStats } from "@/lib/global-storage";

export async function DELETE(
    request: Request,
    context: { params: { id: string } }
) {
    try {
        // Extract the ID from the URL params
        const params = await context.params;
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
        }

        // Get storage stats before cleanup
        const beforeStats = getStorageStats();

        // Clean up the image data
        cleanupImage(id);

        // Get storage stats after cleanup
        const afterStats = getStorageStats();

        return NextResponse.json({
            success: true,
            message: `Image data for ID ${id} has been cleaned up`,
            stats: {
                before: beforeStats,
                after: afterStats
            }
        });
    } catch (error) {
        console.error("Error in cleanup endpoint:", error);
        return NextResponse.json(
            { error: "Failed to clean up image data", details: String(error) },
            { status: 500 }
        );
    }
}