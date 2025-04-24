// In a real application, this would be replaced with a database or cloud storage solution
// This is a simple in-memory solution for demonstration purposes only

interface StoredImage {
    original: Blob;
    processed: Blob;
}

// Simple in-memory storage - will be lost on server restart
// In production, use a database or persistent storage solution
const imageStorage = new Map<string, StoredImage>();

export function storeImages(id: string, original: Blob, processed: Blob): void {
    imageStorage.set(id, { original, processed });
}

export function getImage(id: string, type: 'original' | 'processed'): Blob | null {
    const storedImages = imageStorage.get(id);
    if (!storedImages) return null;

    return type === 'original' ? storedImages.original : storedImages.processed;
}

export function hasImage(id: string): boolean {
    return imageStorage.has(id);
}

export function deleteImages(id: string): boolean {
    return imageStorage.delete(id);
}

// Helper function to clear all images (for testing purposes)
export function clearAllImages(): void {
    imageStorage.clear();
}