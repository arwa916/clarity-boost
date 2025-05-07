// This file creates a global storage for images that persists across API requests
// In a production environment, you'd replace this with a database or cloud storage

// Define a global type for the Next.js global object
declare global {
    var __imageStorage: Map<string, {
        original: Blob;
        processed: Blob;
    }> | undefined;
}

// Ensure our storage map exists in the global scope
if (!global.__imageStorage) {
    console.log("[STORAGE] Initializing global image storage");
    global.__imageStorage = new Map();
}

/**
 * Store both original and processed images for a given ID
 */
export function storeImages(id: string, original: Blob, processed: Blob): void {
    console.log(`[STORAGE] Storing images for ID ${id}: original size=${original.size}, processed size=${processed.size}`);
    global.__imageStorage!.set(id, { original, processed });
    console.log(`[STORAGE] Storage now has ${global.__imageStorage!.size} entries`);
}

/**
 * Get an image by ID and type (original or processed)
 */
export function getImage(id: string, type: 'original' | 'processed'): Blob | null {
    console.log(`[STORAGE] Attempting to get ${type} image for ID ${id}`);
    const entry = global.__imageStorage!.get(id);

    if (!entry) {
        console.log(`[STORAGE] No entry found for ID ${id}`);
        return null;
    }

    console.log(`[STORAGE] Found entry for ID ${id}, returning ${type} image`);
    return type === 'original' ? entry.original : entry.processed;
}

/**
 * Check if images exist for a given ID
 */
export function hasImage(id: string): boolean {
    return global.__imageStorage!.has(id);
}

/**
 * Delete images for a specific ID - explicitly called when the user navigates away
 * Returns true if images were deleted, false if they didn't exist
 */
export function cleanupImage(id: string): boolean {
    console.log(`[STORAGE] Cleaning up images for ID ${id}`);

    if (!global.__imageStorage!.has(id)) {
        console.log(`[STORAGE] No images found for ID ${id}`);
        return false;
    }

    const result = global.__imageStorage!.delete(id);
    console.log(`[STORAGE] Deletion result for ID ${id}: ${result ? 'SUCCESS' : 'FAILED'}`);
    console.log(`[STORAGE] Storage now has ${global.__imageStorage!.size} entries after cleanup`);
    return result;
}

/**
 * Get storage statistics
 */
export function getStorageStats(): { count: number; totalSize: number } {
    let totalSize = 0;

    for (const images of global.__imageStorage!.values()) {
        totalSize += images.original.size + images.processed.size;
    }

    return {
        count: global.__imageStorage!.size,
        totalSize
    };
}

/**
 * Clear all images (for testing purposes)
 */
export function clearAllImages(): void {
    global.__imageStorage!.clear();
    console.log("[STORAGE] All images cleared from storage");
}