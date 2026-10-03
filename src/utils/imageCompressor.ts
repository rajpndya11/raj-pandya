/**
 * High-performance browser-side image optimizer.
 * Compresses camera/phone photos (often 3-15MB) down to 50-90KB web-optimized JPEG.
 * Ensures compatibility with browser localStorage (5MB total) and Firestore (1MB document limit).
 */
export async function compressImage(
  file: File,
  maxWidth = 720,
  maxHeight = 960,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('Empty image payload'));
        return;
      }

      // If SVG, return as is
      if (file.type === 'image/svg+xml') {
        resolve(src);
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          resolve(src); // fallback
          return;
        }

        // Fill background with subtle dark tone in case of transparent PNG converted to JPEG
        ctx.fillStyle = '#171A18';
        ctx.fillRect(0, 0, width, height);

        // Smooth high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as web-standard JPEG
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Normalizes user-pasted image URLs (e.g. Google Drive, Dropbox) into direct image URLs
 * that can be displayed by standard browser <img> tags.
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // 1. Google Drive URLs
  // Patterns: https://drive.google.com/file/d/FILE_ID/view... or https://drive.google.com/open?id=FILE_ID
  const driveFileMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }
  const driveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (trimmed.includes('drive.google.com') && driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }

  // 2. Dropbox URLs
  // Convert dl=0 to raw=1
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('dl=0')) {
      return trimmed.replace('dl=0', 'raw=1');
    }
    if (!trimmed.includes('raw=1')) {
      return trimmed.includes('?') ? `${trimmed}&raw=1` : `${trimmed}?raw=1`;
    }
  }

  return trimmed;
}
