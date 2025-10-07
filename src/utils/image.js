import mimeTypes from 'mime-types';
import axios from 'axios';

/**
 * Tries to guess the MIME type of an image based on the initial bytes (magic numbers) of its base64 representation.
 * This function only handles a few common image types and is not exhaustive.
 *
 * @param {string} base64String - The base64 encoded string of the image.
 * @returns {string|null} The guessed MIME type or false if unable to guess.
 */
export const guessMimeTypeFromBase64 = (base64String) => {
  // Decode the first few bytes of the base64 string to a binary string
  const binaryStr = atob(base64String.substring(0, 50)); // Decode a portion to check magic numbers

  const byteArr = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i += 1) {
    byteArr[i] = binaryStr.charCodeAt(i);
  }

  // Common image format magic numbers
  if (byteArr[0] === 0xff && byteArr[1] === 0xd8 && byteArr[2] === 0xff) {
    return 'image/jpeg';
  }
  if (byteArr[0] === 0x89 && byteArr[1] === 0x50 && byteArr[2] === 0x4e && byteArr[3] === 0x47) {
    return 'image/png';
  }
  if (byteArr[0] === 0x47 && byteArr[1] === 0x49 && byteArr[2] === 0x46) {
    return 'image/gif';
  }
  if (byteArr[0] === 0x42 && byteArr[1] === 0x4d) {
    return 'image/bmp';
  }
  if (byteArr[0] === 0x49 && byteArr[1] === 0x49 && byteArr[2] === 0x2a && byteArr[3] === 0x00) {
    return 'image/tiff';
  }
  if (byteArr[0] === 0x4d && byteArr[1] === 0x4d && byteArr[2] === 0x00 && byteArr[3] === 0x2a) {
    return 'image/tiff';
  }

  // If no known signature is found, return false
  return false;
};

/**
 * Determines the MIME type of a file based on its source URL/extension or base64 string.
 *
 * @param {string} source - A file URL or extension to lookup MIME type from
 * @param {string} base64 - A base64 string representation of the file
 * @returns {string|false} The MIME type if found, otherwise tries to guess based on base64 content. Returns false if unable to determine.
 */
export const getMimeType = (source, base64) => {
  // Try to lookup the MIME type based on the input directly (assuming it might be a file extension)
  let mimeType = mimeTypes.lookup(source);

  // If lookup fails and the input is a base64 string (without the MIME type prefix), try to guess the MIME type
  if (!mimeType && base64 && base64.length > 0) {
    mimeType = guessMimeTypeFromBase64(base64);
  }

  return mimeType;
};

/**
 * Parses a data URL and extracts the MIME type and base64 content.
 *
 * @param {string} dataUrl - The data URL to parse (e.g., "data:image/png;base64,iVBORw0...")
 * @returns {Object|null} Object with {mimeType: string, base64: string} or null if invalid
 */
export function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!match || match.length !== 3) {
    return null;
  }
  return {
    mimeType: match[1],
    base64: match[2],
  };
}

/**
 * Downloads an image from a URL and converts it to base64.
 *
 * @param {string} url - The URL of the image to download
 * @param {number} timeout - Timeout in milliseconds (default: 5000)
 * @param {number} maxSize - Maximum allowed size in bytes (default: 10MB)
 * @returns {Promise<string>} Base64 string of the image
 * @throws {Error} On timeout, network errors, HTTP errors, or validation failures
 */
export async function downloadImageToBase64(url, timeout = 5000, maxSize = 10 * 1024 * 1024) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout, // timeout in milliseconds
      maxContentLength: maxSize, // max size in bytes (10MB default)
      maxBodyLength: maxSize,
      validateStatus: (status) => status === 200, // Only accept 200 OK
    });

    // Validate response data
    if (!response.data || response.data.length === 0) {
      throw new Error('Empty response data received');
    }

    // Convert arraybuffer to base64
    const base64 = Buffer.from(response.data).toString('base64');

    // Ensure we got valid base64 data
    if (!base64 || base64.length === 0) {
      throw new Error('Failed to convert response to base64');
    }

    return base64;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Request timeout after ${timeout}ms`);
    } else if (error.response) {
      throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}
