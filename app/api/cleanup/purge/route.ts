import { NextResponse } from "next/server";
import { purgeOldImages, getStorageStats } from "@/lib/global-storage";

export async function POST(request: Request) {
    try {
        // Get storage stats before purge
        const beforeStats = getStorageStats();

        // Run the purge operation
        const purgedCount = purgeOldImages();

        // Get storage stats after purge
        const afterStats = getStorageStats();

        return NextResponse.json({
            success: true,
            purgedCount,
            message: `Purged ${purgedCount} old image entries`,
            stats: {
                before: beforeStats,
                after: afterStats
            }
        });
    } catch (error) {
        console.error("Error in purge endpoint:", error);
        return NextResponse.json(
            { error: "Failed to purge old images", details: String(error) },
            { status: 500 }
        );
    }
}