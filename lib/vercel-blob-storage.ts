import { put, del, list, get } from '@vercel/blob';

/**
 * Store both original and processed images for a given ID
 */
export async function storeImages(id: string, original: Blob, processed: Blob): Promise<void> {
    try {
        console.log(`[STORAGE] Storing images for ID ${id}: original size=${original.size}, processed size=${processed.size}`);

        // Store original image
        const originalResult = await put(`deblur/${id}/original`, original, {
            access: 'public',
            addRandomSuffix: false // Use exact filename to make retrieval easier
        });

        // Store processed image
        const processedResult = await put(`deblur/${id}/processed`, processed, {
            access: 'public',
            addRandomSuffix: false
        });

        console.log(`[STORAGE] Successfully stored images for ID ${id}`);
        console.log(`[STORAGE] Original URL: ${originalResult.url}`);
        console.log(`[STORAGE] Processed URL: ${processedResult.url}`);

    } catch (error) {
        console.error(`[STORAGE] Error storing images for ID ${id}:`, error);
        throw error;
    }
}

/**
 * Get an image URL by ID and type (original or processed)
 * Returns null if the image is not found
 */
export async function getImageUrl(id: string, type: 'original' | 'processed'): Promise<string | null> {
    try {
        console.log(`[STORAGE] Getting ${type} image URL for ID: ${id}`);

        // List blobs in the specific folder for this ID
        const blobs = await list({ prefix: `deblur/${id}/` });

        // Find the blob for the requested type
        const blob = blobs.blobs.find(blob => blob.pathname === `deblur/${id}/${type}`);

        if (!blob) {
            console.log(`[STORAGE] No ${type} image found for ID: ${id}`);
            return null;
        }

        console.log(`[STORAGE] Found ${type} image for ID: ${id} at URL: ${blob.url}`);
        return blob.url;

    } catch (error) {
        console.error(`[STORAGE] Error getting ${type} image URL for ID: ${id}:`, error);
        return null;
    }
}

/**
 * Check if images exist for a given ID
 */
export async function hasImage(id: string): Promise<boolean> {
    try {
        const blobs = await list({ prefix: `deblur/${id}/` });
        const hasFiles = blobs.blobs.length > 0;
        console.log(`[STORAGE] Checked for ID ${id}: ${hasFiles ? 'Images found' : 'No images found'}`);
        return hasFiles;
    } catch (error) {
        console.error(`[STORAGE] Error checking for images with ID ${id}:`, error);
        return false;
    }
}

/**
 * Delete all images for a given ID
 * Returns true if images were deleted, false if they didn't exist
 */
export async function cleanupImage(id: string): Promise<boolean> {
    try {
        console.log(`[STORAGE] Cleaning up images for ID ${id}`);

        // List all blobs with this ID prefix
        const blobs = await list({ prefix: `deblur/${id}/` });

        if (blobs.blobs.length === 0) {
            console.log(`[STORAGE] No images found for ID ${id}`);
            return false;
        }

        // Delete each blob found
        for (const blob of blobs.blobs) {
            console.log(`[STORAGE] Deleting blob: ${blob.pathname}`);
            await del(blob.url);
        }

        console.log(`[STORAGE] Successfully deleted ${blobs.blobs.length} blobs for ID ${id}`);
        return true;

    } catch (error) {
        console.error(`[STORAGE] Error cleaning up images for ID ${id}:`, error);
        return false;
    }
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{ count: number; size: number }> {
    try {
        // List all blobs in the deblur folder
        const blobs = await list({ prefix: 'deblur/' });

        // Calculate total size
        const totalSize = blobs.blobs.reduce((sum, blob) => sum + blob.size, 0);

        return {
            count: blobs.blobs.length,
            size: totalSize
        };
    } catch (error) {
        console.error(`[STORAGE] Error getting storage stats:`, error);
        return {
            count: 0,
            size: 0
        };
    }
}

/**
 * Convert a Node.js ReadableStream to a Blob
 * Useful for API routes that receive file uploads
 */
export async function streamToBlob(stream: ReadableStream): Promise<Blob> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    return new Blob(chunks);
}