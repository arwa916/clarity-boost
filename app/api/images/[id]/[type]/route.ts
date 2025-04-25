import { NextRequest, NextResponse } from "next/server"
import { getImage } from "@/lib/global-storage"

export async function GET(
    request: NextRequest,
    context: { params: { id: string; type: string } }
) {
    try {
        // First await the entire params object
        const params = await context.params;
        const id = params.id;
        const type = params.type; // 'original' or 'processed'

        if (!id || !type) {
            return NextResponse.json({ error: "Missing ID or type parameter" }, { status: 400 });
        }

        if (type !== "original" && type !== "processed") {
            return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
        }

        // Get the image from our storage utility
        const image = getImage(id, type as 'original' | 'processed');

        if (image) {
            // If we have the image stored, return it
            // Return the image with the appropriate content type
            // Note that the processed image from the Python API will be a PNG
            const contentType = type === "processed" ? "image/png" : (image.type || "image/jpeg");
            return new NextResponse(image, {
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=3600", // Cache for 1 hour
                },
            });
        } else {
            // If we don't have the image, return a placeholder
            // In a real app, you might want to return a proper error
            const placeholderResponse = await fetch(new URL("/placeholder.jpg", request.url));
            const placeholderBlob = await placeholderResponse.blob();

            return new NextResponse(placeholderBlob, {
                headers: {
                    "Content-Type": "image/jpeg",
                    "Cache-Control": "public, max-age=60", // Cache for 1 minute
                },
            });
        }
    } catch (error) {
        console.error(`Error serving image:`, error);
        return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
    }
}

// This file uses the centralized image storage from lib/image-storage.ts