import { NextRequest, NextResponse } from "next/server"
import { getImageUrl } from "@/lib/vercel-blob-storage"

export async function GET(
    request: NextRequest,
    context: { params: { id: string; type: string } }
) {
    try {
        // First await the entire params object
        const params = await context.params;
        const id = params.id;
        const type = params.type; // 'original' or 'processed'

        console.log(`[IMAGE-API] Requested ${type} image for ID: ${id}`);

        if (!id || !type) {
            return NextResponse.json({ error: "Missing ID or type parameter" }, { status: 400 });
        }

        if (type !== "original" && type !== "processed") {
            return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
        }

        // Get the image URL from Vercel Blob
        const imageUrl = await getImageUrl(id, type as 'original' | 'processed');

        if (imageUrl) {
            // If we have the image URL, redirect to it
            console.log(`[IMAGE-API] Redirecting to Vercel Blob URL: ${imageUrl}`);

            // Return a redirect response to the Vercel Blob URL
            return NextResponse.redirect(imageUrl);
        } else {
            // Log detailed information about the missing image
            console.error(`[IMAGE-API] Image not found in storage for ID: ${id}, type: ${type}`);

            // If we don't have the image, return a placeholder
            const placeholderResponse = await fetch(new URL("/placeholder.jpg", request.url));
            const placeholderBlob = await placeholderResponse.blob();

            return new NextResponse(placeholderBlob, {
                headers: {
                    "Content-Type": "image/jpeg",
                    "Cache-Control": "public, max-age=60", // Cache placeholder for 1 minute
                    "X-Image-Status": "placeholder",
                },
            });
        }
    } catch (error) {
        console.error(`[IMAGE-API] Error serving image:`, error);
        return NextResponse.json({ error: "Failed to serve image" }, { status: 500 });
    }
}