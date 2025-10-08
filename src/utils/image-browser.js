/**
 * Browser-compatible image utilities to replace image-to-base64 and image-size
 */

/**
 * Converts an image URL to base64 using browser fetch API
 * @param {string} url - Image URL to convert
 * @returns {Promise<string>} Base64 string (without data URI prefix)
 */
export async function imageUrlToBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the data URI prefix to get just the base64 string
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
}

/**
 * Gets image dimensions using browser Image API
 * @param {ArrayBuffer|Uint8Array|string} imageData - Image data as ArrayBuffer, Uint8Array, or base64 string
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export async function getImageSize(imageData) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for size detection'));
    };

    // Handle different input types
    if (typeof imageData === 'string') {
      // If it's a base64 string without data URI prefix, add it
      if (!imageData.startsWith('data:')) {
        // Assume it's a base64 string, try to determine format from magic bytes
        const mimeType = guessMimeTypeFromBase64(imageData) || 'image/png';
        img.src = `data:${mimeType};base64,${imageData}`;
      } else {
        img.src = imageData;
      }
    } else if (imageData instanceof ArrayBuffer || imageData instanceof Uint8Array) {
      // Convert to base64
      const bytes = imageData instanceof Uint8Array ? imageData : new Uint8Array(imageData);
      const base64 = arrayBufferToBase64(bytes);
      const mimeType = guessMimeTypeFromBytes(bytes) || 'image/png';
      img.src = `data:${mimeType};base64,${base64}`;
    } else {
      reject(new Error('Invalid image data type'));
    }
  });
}

/**
 * Convert ArrayBuffer/Uint8Array to base64
 * @param {Uint8Array} bytes
 * @returns {string} Base64 string
 */
function arrayBufferToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Guess MIME type from magic numbers in byte array
 * @param {Uint8Array} bytes
 * @returns {string|null} MIME type or null
 */
function guessMimeTypeFromBytes(bytes) {
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  } else if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
    return 'image/bmp';
  } else if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2A && bytes[3] === 0x00) ||
             (bytes[0] === 0x4D && bytes[1] === 0x4D && bytes[2] === 0x00 && bytes[3] === 0x2A)) {
    return 'image/tiff';
  }
  return null;
}

/**
 * Guess MIME type from base64 string
 * @param {string} base64String
 * @returns {string|null} MIME type or null
 */
function guessMimeTypeFromBase64(base64String) {
  try {
    const binaryStr = atob(base64String.substring(0, 50));
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return guessMimeTypeFromBytes(bytes);
  } catch (e) {
    return null;
  }
}
