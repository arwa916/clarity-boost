// This file creates a global storage for images that persists across API requests
// In a production environment, you'd replace this with a database or cloud storage

// Define a global type for the Next.js global object
declare global {
    var __imageStorage: Map<string, {
        original: Blob;
        processed: Blob;
        timestamp: number; // Add timestamp for age-based purging
    }> | undefined;
}

// Maximum age for images in milliseconds (default: 1 hour)
const IMAGE_MAX_AGE = 1000 * 60 * 5;

// Maximum number of entries to keep in storage
const MAX_STORAGE_ENTRIES = 5;

// Ensure our storage map exists in the global scope
if (!global.__imageStorage) {
    console.log("Initializing global image storage");
    global.__imageStorage = new Map();
}

/**
 * Store both original and processed images for a given ID
 */
export function storeImages(id: string, original: Blob, processed: Blob): void {
    console.log(`Storing images for ID ${id}: original size=${original.size}, processed size=${processed.size}`);
    global.__imageStorage!.set(id, {
        original,
        processed,
        timestamp: Date.now()
    });
    console.log(`Storage now has ${global.__imageStorage!.size} entries`);

    // Check if we should purge old images after adding new one
    if (global.__imageStorage!.size > MAX_STORAGE_ENTRIES) {
        purgeOldImages();
    }
}

/**
 * Get an image by ID and type (original or processed)
 * Returns null if the image is not found
 */
export function getImage(id: string, type: 'original' | 'processed'): Blob | null {
    console.log(`Attempting to get ${type} image for ID ${id}`);
    const entry = global.__imageStorage!.get(id);

    if (!entry) {
        console.log(`No entry found for ID ${id}`);
        return null;
    }

    console.log(`Found entry for ID ${id}, returning ${type} image`);
    return type === 'original' ? entry.original : entry.processed;
}

/**
 * Check if images exist for a given ID
 */
export function hasImage(id: string): boolean {
    return global.__imageStorage!.has(id);
}

/**
 * Delete all images for a given ID
 * Returns true if images were deleted, false if they didn't exist
 */
export function deleteImages(id: string): boolean {
    return global.__imageStorage!.delete(id);
}

/**
 * Delete images for a specific ID when the user leaves the results page
 * This can be called from the client side via an API endpoint
 */
export function cleanupImage(id: string): boolean {
    console.log(`[CLEANUP] Attempting to clean up images for ID ${id}`);

    if (global.__imageStorage!.has(id)) {
        console.log(`[CLEANUP] Found images for ID ${id}, deleting...`);
        const result = global.__imageStorage!.delete(id);
        console.log(`[CLEANUP] Deletion result: ${result ? 'SUCCESS' : 'FAILED'}`);
        console.log(`[CLEANUP] Storage now has ${global.__imageStorage!.size} entries after cleanup`);
        return result;
    } else {
        console.log(`[CLEANUP] No images found for ID ${id}`);
        return false;
    }
}

/**
 * Purge old images based on timestamp and/or storage size
 */
export function purgeOldImages(): number {
    if (!global.__imageStorage || global.__imageStorage.size === 0) {
        return 0;
    }

    console.log(`Storage purge triggered - Current size: ${global.__imageStorage.size} entries`);

    const now = Date.now();
    let purgedCount = 0;

    // First, remove entries older than IMAGE_MAX_AGE
    for (const [id, entry] of global.__imageStorage) {
        if (now - entry.timestamp > IMAGE_MAX_AGE) {
            global.__imageStorage.delete(id);
            purgedCount++;
        }
    }

    // If we still have too many entries, remove the oldest ones
    if (global.__imageStorage.size > MAX_STORAGE_ENTRIES) {
        // Convert to array and sort by timestamp
        const entries = Array.from(global.__imageStorage.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Calculate how many we need to remove
        const excessEntries = global.__imageStorage.size - MAX_STORAGE_ENTRIES;

        // Remove the oldest entries
        for (let i = 0; i < excessEntries; i++) {
            if (i < entries.length) {
                global.__imageStorage.delete(entries[i][0]);
                purgedCount++;
            }
        }
    }

    console.log(`Purged ${purgedCount} old entries. New size: ${global.__imageStorage.size} entries`);
    return purgedCount;
}

/**
 * Get storage statistics
 */
export function getStorageStats(): { count: number; totalSize: number; oldestTimestamp: number | null; newestTimestamp: number | null } {
    let totalSize = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const [_, images] of global.__imageStorage!.entries()) {
        totalSize += images.original.size + images.processed.size;

        if (oldestTimestamp === null || images.timestamp < oldestTimestamp) {
            oldestTimestamp = images.timestamp;
        }

        if (newestTimestamp === null || images.timestamp > newestTimestamp) {
            newestTimestamp = images.timestamp;
        }
    }

    return {
        count: global.__imageStorage!.size,
        totalSize,
        oldestTimestamp,
        newestTimestamp
    };
}

/**
 * Clear all images (for testing purposes)
 */
export function clearAllImages(): void {
    global.__imageStorage!.clear();
}