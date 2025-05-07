import { NextResponse } from "next/server";
import { cleanupImage, getStorageStats } from "@/lib/vercel-blob-storage";

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

        console.log(`[CLEANUP-API] Received cleanup request for ID: ${id}`);

        // Get storage stats before cleanup
        const beforeStats = await getStorageStats();
        console.log(`[CLEANUP-API] Before cleanup - Storage entries: ${beforeStats.count}, Size: ${Math.round(beforeStats.size / 1024)} KB`);

        // Clean up the image data
        const cleanupResult = await cleanupImage(id);
        console.log(`[CLEANUP-API] Cleanup result for ID ${id}: ${cleanupResult ? 'SUCCESS' : 'Image not found or cleanup failed'}`);

        // Get storage stats after cleanup
        const afterStats = await getStorageStats();
        console.log(`[CLEANUP-API] After cleanup - Storage entries: ${afterStats.count}, Size: ${Math.round(afterStats.size / 1024)} KB`);

        return NextResponse.json({
            success: cleanupResult,
            message: cleanupResult
                ? `Image data for ID ${id} has been cleaned up`
                : `No image data found for ID ${id} or cleanup failed`,
            stats: {
                before: beforeStats,
                after: afterStats
            }
        });
    } catch (error) {
        console.error("[CLEANUP-API] Error in cleanup endpoint:", error);
        return NextResponse.json(
            { error: "Failed to clean up image data", details: String(error) },
            { status: 500 }
        );
    }
}