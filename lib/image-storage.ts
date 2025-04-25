// In a real application, this would be replaced with a database or cloud storage solution
// This is a simple in-memory solution for demonstration purposes only

interface StoredImage {
    original: Blob;
    processed: Blob;
}

// Simple in-memory storage - will be lost on server restart
// In production, use a database or persistent storage solution
const imageStorage = new Map<string, StoredImage>();

/**
 * Store both original and processed images for a given ID
 */
export function storeImages(id: string, original: Blob, processed: Blob): void {
    console.log(`Storing images for ID ${id}: original size=${original.size}, processed size=${processed.size}`);
    imageStorage.set(id, { original, processed });
}

/**
 * Get an image by ID and type (original or processed)
 * Returns null if the image is not found
 */
export function getImage(id: string, type: 'original' | 'processed'): Blob | null {
    const storedImages = imageStorage.get(id);
    if (!storedImages) {
        console.log(`Image not found for ID ${id}`);
        return null;
    }

    console.log(`Retrieved ${type} image for ID ${id}`);
    return type === 'original' ? storedImages.original : storedImages.processed;
}

/**
 * Check if images exist for a given ID
 */
export function hasImage(id: string): boolean {
    return imageStorage.has(id);
}

/**
 * Delete all images for a given ID
 * Returns true if images were deleted, false if they didn't exist
 */
export function deleteImages(id: string): boolean {
    return imageStorage.delete(id);
}

/**
 * Get storage statistics
 */
export function getStorageStats(): { count: number, totalSize: number } {
    let totalSize = 0;

    for (const images of imageStorage.values()) {
        totalSize += images.original.size + images.processed.size;
    }

    return {
        count: imageStorage.size,
        totalSize
    };
}

/**
 * Clear all images (for testing purposes)
 */
export function clearAllImages(): void {
    imageStorage.clear();
}