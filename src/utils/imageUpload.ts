/**
 * Client-side image compression and Cloudinary upload utility
 */

export interface UploadResult {
  url: string;
  isCloudinary: boolean;
}

/**
 * Resizes and compresses an image in the browser to max 900px width/height and ~150KB JPEG
 */
export async function compressImage(file: File, maxWidth = 900, maxHeight = 900, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable for image compression'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(new Error('Failed to load image file for compression'));
    };
    reader.onerror = (err) => reject(new Error('Failed to read image file'));
  });
}

/**
 * Uploads a compressed image blob to Cloudinary using an unsigned upload preset
 */
export async function uploadToCloudinary(compressedBlob: Blob): Promise<UploadResult> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // If Cloudinary environment variables are configured, upload to Cloudinary
  if (cloudName && uploadPreset && cloudName !== 'your-cloud-name' && uploadPreset !== 'your-unsigned-upload-preset') {
    const formData = new FormData();
    formData.append('file', compressedBlob, 'upload.jpg');
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || response.statusText || 'Upload failed';
      throw new Error(`Cloudinary upload error: ${errorMsg}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url || data.url,
      isCloudinary: true,
    };
  }

  // Fallback: If Cloudinary credentials are not set in environment yet,
  // convert to an optimized data URL so image preview and saving works immediately in dev/preview!
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result as string,
        isCloudinary: false,
      });
    };
    reader.readAsDataURL(compressedBlob);
  });
}
