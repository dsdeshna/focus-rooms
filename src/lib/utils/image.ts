/**
 * Compresses an image data URL by drawing it to a canvas and exporting as JPEG/WebP.
 * This ensures that large uploads (e.g., 8MB photos) are resized and compressed 
 * to be stored efficiently in the database and broadcasted via Realtime.
 */
export async function compressImage(dataUrl: string, maxWidth = 1920, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Handle downscaling if the image is massive
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw background first for contrast if png has transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as WebP (if supported) or JPEG
      try {
        const compressedUrl = canvas.toDataURL('image/webp', quality);
        resolve(compressedUrl);
      } catch (e) {
        // Fallback to JPEG if WebP export fails
        resolve(canvas.toDataURL('image/jpeg', quality));
      }
    };
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = dataUrl;
  });
}
