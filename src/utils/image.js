import mimeTypes from 'mime-types';
import axios from 'axios';

/**
 * Checks if sharp is available for SVG conversion.
 * @returns {Promise<boolean>} True if sharp is available
 */
export async function isSharpAvailable() {
  try {
    await import('sharp');
    return true;
  } catch (e) {
    return false;
  }
}

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

  // Common image format magic numbers (file signatures in hexadecimal)
  // Magic numbers are industry-standard byte sequences at the start of files
  // that identify file types. Hex values are used because they directly represent
  // the binary bytes as specified in format standards (e.g., PNG spec, JPEG spec).

  // JPEG: FF D8 FF (JPEG Start of Image marker)
  if (byteArr[0] === 0xff && byteArr[1] === 0xd8 && byteArr[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 (PNG signature: \x89PNG)
  if (byteArr[0] === 0x89 && byteArr[1] === 0x50 && byteArr[2] === 0x4e && byteArr[3] === 0x47) {
    return 'image/png';
  }
  // GIF: 47 49 46 (ASCII "GIF")
  if (byteArr[0] === 0x47 && byteArr[1] === 0x49 && byteArr[2] === 0x46) {
    return 'image/gif';
  }
  // BMP: 42 4D (ASCII "BM" for bitmap)
  if (byteArr[0] === 0x42 && byteArr[1] === 0x4d) {
    return 'image/bmp';
  }
  // TIFF: 49 49 2A 00 (little-endian TIFF)
  if (byteArr[0] === 0x49 && byteArr[1] === 0x49 && byteArr[2] === 0x2a && byteArr[3] === 0x00) {
    return 'image/tiff';
  }
  // TIFF: 4D 4D 00 2A (big-endian TIFF)
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
 * Checks if a MIME type or file extension indicates an SVG image.
 *
 * @param {string} mimeTypeOrExtension - MIME type (e.g., "image/svg+xml") or file extension (e.g., ".svg")
 * @returns {boolean} True if the input indicates an SVG image
 */
export function isSVG(mimeTypeOrExtension) {
  if (!mimeTypeOrExtension) return false;
  const normalized = mimeTypeOrExtension.toLowerCase().trim();
  return (
    normalized === 'image/svg+xml' ||
    normalized === 'image/svg' ||
    normalized === '.svg' ||
    normalized === 'svg' ||
    normalized.endsWith('.svg')
  );
}

/**
 * Converts an SVG to PNG using sharp library.
 *
 * @param {string|Buffer} svgInput - SVG as string, Buffer, or base64 string
 * @param {Object} options - Conversion options
 * @param {number} options.width - Output width in pixels (optional)
 * @param {number} options.height - Output height in pixels (optional)
 * @param {number} options.density - DPI density for rendering (default: 72)
 * @returns {Promise<Buffer>} PNG buffer
 * @throws {Error} If sharp is not available or conversion fails
 */
export async function convertSVGtoPNG(svgInput, options = {}) {
  try {
    // Dynamically import sharp
    const sharp = await import('sharp').then((m) => m.default || m);

    const { width, height, density = 72 } = options;

    let svgBuffer;
    if (typeof svgInput === 'string') {
      // Check if it's base64
      if (svgInput.match(/^[A-Za-z0-9+/=]+$/)) {
        svgBuffer = Buffer.from(svgInput, 'base64');
      } else {
        // Assume it's SVG XML string
        svgBuffer = Buffer.from(svgInput, 'utf-8');
      }
    } else if (Buffer.isBuffer(svgInput)) {
      svgBuffer = svgInput;
    } else {
      throw new Error('Invalid SVG input type');
    }

    // Convert SVG to PNG using sharp
    let sharpInstance = sharp(svgBuffer, { density });

    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      });
    }

    const pngBuffer = await sharpInstance.png().toBuffer();
    return pngBuffer;
  } catch (error) {
    throw new Error(`Failed to convert SVG to PNG: ${error.message}`);
  }
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
