import axios from 'axios';
import mimeTypes from 'mime-types';
import sizeOf from 'image-size';

import { isValidUrl } from './url';
import * as xmlBuilder from '../helpers/xml-builder';
import {
  SVG_UNIT_TO_PIXEL_CONVERSIONS,
  defaultDocumentOptions,
  imageType,
  internalRelationship,
} from '../constants';

// Import sharp as external dependency (optional)
// It's marked as external in rollup.config.js so it won't be bundled
// Try-catch prevents module load failure when sharp is not installed
// convertSVGtoPNG will throw a helpful error if sharp is needed but missing
let sharp;
try {
  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  sharp = require('sharp');
} catch (e) {
  // Sharp not installed - will use native SVG mode
  sharp = null;
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
 * Converts SVG dimension values with units to pixels.
 * Reference: https://www.w3.org/TR/SVG/coords.html#Units
 *
 * @param {number} value - The numeric value
 * @param {string} unit - The unit (px, cm, mm, in, pt, pc, em, rem, %)
 * @returns {number} Value in pixels
 */
function convertSVGUnitToPixels(value, unit) {
  const factor = SVG_UNIT_TO_PIXEL_CONVERSIONS[unit] || 1;
  return Math.round(value * factor);
}

/**
 * Parses SVG dimensions from SVG string, supporting various formats.
 * Handles: integers, decimals, units (px, cm, mm, in, pt, pc, em, rem, %), and viewBox fallback.
 *
 * @param {string} svgString - The SVG XML string
 * @returns {Object} Object with {width, height} in pixels, or undefined if not found
 */
export function parseSVGDimensions(svgString) {
  // Try to extract width and height attributes
  // Regex supports: integers, decimals, and units (px, cm, mm, in, pt, pc, em, rem, %)
  const widthMatch = svgString.match(/width\s*=\s*["']?([0-9.]+)([a-z%]*)/i);
  const heightMatch = svgString.match(/height\s*=\s*["']?([0-9.]+)([a-z%]*)/i);

  let width;
  let height;

  if (widthMatch) {
    const value = parseFloat(widthMatch[1]);
    const unit = widthMatch[2]?.toLowerCase() || 'px';
    width = convertSVGUnitToPixels(value, unit);
  }

  if (heightMatch) {
    const value = parseFloat(heightMatch[1]);
    const unit = heightMatch[2]?.toLowerCase() || 'px';
    height = convertSVGUnitToPixels(value, unit);
  }

  // If width/height not found or invalid, try viewBox as fallback
  if (!width || !height) {
    const viewBoxMatch = svgString.match(/viewBox\s*=\s*["']?([0-9.\s-]+)["']?/i);
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].trim().split(/\s+/);
      if (parts.length === 4) {
        // viewBox format: "minX minY width height"
        const viewBoxWidth = parseFloat(parts[2]);
        const viewBoxHeight = parseFloat(parts[3]);

        // If we only have one dimension, calculate the other from viewBox aspect ratio
        if (!width && height && viewBoxWidth && viewBoxHeight) {
          width = Math.round((height * viewBoxWidth) / viewBoxHeight);
        } else if (width && !height && viewBoxWidth && viewBoxHeight) {
          height = Math.round((width * viewBoxHeight) / viewBoxWidth);
        } else if (!width && !height) {
          // Use viewBox dimensions directly
          width = Math.round(viewBoxWidth);
          height = Math.round(viewBoxHeight);
        }
      }
    }
  }

  // Default fallback if no dimensions found
  // Using reasonable defaults for SVG without explicit dimensions
  return {
    width: width || 300,
    height: height || 150,
  };
}

export async function convertSVGtoPNG(svgInput, options = {}) {
  try {
    // Check if sharp is available
    if (!sharp) {
      throw new Error('Sharp is not installed. Install it with: npm install sharp');
    }

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

/**
 * Helper function for verbose logging
 * @param {boolean} verboseLogging - Whether verbose logging is enabled
 * @param {string} message - Message to log
 * @param {...any} args - Additional arguments to log
 */
const logVerbose = (verboseLogging, message, ...args) => {
  if (verboseLogging) {
    // eslint-disable-next-line no-console
    console.log(message, ...args);
  }
};

/**
 * Downloads and caches an image with retry logic and exponential backoff.
 * Handles caching, retries, and failure tracking per document instance.
 *
 * @param {Object} docxDocumentInstance - The document instance containing cache and stats
 * @param {string} imageSource - The image URL to download
 * @param {Object} options - Download options (maxRetries, verboseLogging, etc.)
 * @returns {Promise<string|null>} Base64 data URI or null on failure
 */
export const downloadAndCacheImage = async (docxDocumentInstance, imageSource, options = {}) => {
  const maxRetries =
    options.maxRetries ||
    docxDocumentInstance.imageProcessing?.maxRetries ||
    defaultDocumentOptions.imageProcessing.maxRetries;
  const verboseLogging =
    options.verboseLogging ||
    docxDocumentInstance.imageProcessing?.verboseLogging ||
    defaultDocumentOptions.imageProcessing.verboseLogging;

  // Check cache first for external URLs (if cache is initialized)
  if (docxDocumentInstance._imageCache && docxDocumentInstance._imageCache.has(imageSource)) {
    const cachedData = docxDocumentInstance._imageCache.get(imageSource);
    if (!cachedData || cachedData === 'FAILED') {
      // Previously failed to download in this document generation, skip this image
      logVerbose(
        verboseLogging,
        `[CACHE] Skipping previously failed image in this document: ${imageSource}`
      );
      return null;
    }
    logVerbose(verboseLogging, `[CACHE] Using cached image data for: ${imageSource}`);
    return cachedData;
  }

  // Download and cache the image with retry mechanism
  let base64String = null;
  let lastError = null;

  // eslint-disable-next-line no-await-in-loop
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    if (docxDocumentInstance._retryStats) {
      docxDocumentInstance._retryStats.totalAttempts += 1;
    }

    try {
      logVerbose(verboseLogging, `[RETRY] Attempt ${attempt}/${maxRetries} for: ${imageSource}`);

      // Use configurable timeout, default 5 seconds, with exponential backoff for retries
      const baseTimeout = Math.max(
        defaultDocumentOptions.imageProcessing.minTimeout,
        Math.min(
          options.downloadTimeout || defaultDocumentOptions.imageProcessing.downloadTimeout,
          defaultDocumentOptions.imageProcessing.maxTimeout
        )
      );
      const timeoutMs = baseTimeout * attempt;
      const maxSizeBytes = Math.max(
        defaultDocumentOptions.imageProcessing.minImageSize,
        options.maxImageSize || defaultDocumentOptions.imageProcessing.maxImageSize
      );

      // eslint-disable-next-line no-await-in-loop
      base64String = await downloadImageToBase64(imageSource, timeoutMs, maxSizeBytes);
      if (base64String) {
        if (attempt > 1 && docxDocumentInstance._retryStats) {
          docxDocumentInstance._retryStats.successAfterRetry += 1;
          logVerbose(verboseLogging, `[RETRY] Success on attempt ${attempt} for: ${imageSource}`);
        }
        break;
      }
    } catch (error) {
      lastError = error;
      logVerbose(
        verboseLogging,
        `[RETRY] Attempt ${attempt}/${maxRetries} failed for ${imageSource}: ${error.message}`
      );

      // Add delay before retry (exponential backoff: 500ms, 1000ms, etc.)
      if (attempt < maxRetries) {
        const delay = defaultDocumentOptions.imageProcessing.retryDelayBase * attempt;
        logVerbose(verboseLogging, `[RETRY] Waiting ${delay}ms before retry...`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (!base64String && docxDocumentInstance._retryStats) {
    docxDocumentInstance._retryStats.finalFailures += 1;
  }

  if (base64String) {
    const mimeType = getMimeType(imageSource, base64String);
    const base64Uri = `data:${mimeType};base64,${base64String}`;
    // Cache the successful result (if cache is initialized)
    if (docxDocumentInstance._imageCache) {
      docxDocumentInstance._imageCache.set(imageSource, base64Uri);
      logVerbose(verboseLogging, `[CACHE] Cached new image data for: ${imageSource}`);
    }
    return base64Uri;
  }

  // Cache the failure for THIS document generation only after all retries failed (if cache is initialized)
  // Each document generation has isolated cache, so failures can be retried in new documents
  // Use 'FAILED' sentinel value instead of null (LRU cache doesn't handle null well)
  if (docxDocumentInstance._imageCache) {
    docxDocumentInstance._imageCache.set(imageSource, 'FAILED');
  }
  // eslint-disable-next-line no-console
  console.error(
    `[ERROR] downloadAndCacheImage: Failed to convert URL to base64 after ${maxRetries} attempts: ${
      lastError?.message || 'Unknown error'
    } - will skip duplicates in this document`
  );
  return null;
};

// eslint-disable-next-line consistent-return, no-shadow
export const buildImage = async (
  docxDocumentInstance,
  vNode,
  maximumWidth = null,
  options = {}
) => {
  let response = null;
  let base64Uri = null;

  try {
    const imageSource = vNode.properties.src;

    // Handle external URLs with caching and retry
    if (isValidUrl(imageSource)) {
      base64Uri = await downloadAndCacheImage(docxDocumentInstance, imageSource, options);
      if (!base64Uri) {
        return null;
      }
      // Update vNode to reflect the cached data URL for subsequent processing
      vNode.properties.src = base64Uri;
    } else {
      base64Uri = decodeURIComponent(vNode.properties.src);
    }

    if (base64Uri) {
      response = await docxDocumentInstance.createMediaFile(base64Uri);
    } else {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] buildImage: No valid base64Uri generated`);
      return null;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] buildImage: Error during image processing:`, error);
    return null;
  }

  if (response) {
    try {
      // Validate response has required properties
      if (!response.fileContent || !response.fileNameWithExtension) {
        // eslint-disable-next-line no-console
        console.error(
          `[ERROR] buildImage: Invalid response object for ${vNode.properties.src}:`,
          response
        );
        return null;
      }

      const imageBuffer = Buffer.from(response.fileContent, 'base64');

      docxDocumentInstance.zip
        .folder('word')
        .folder('media')
        .file(response.fileNameWithExtension, imageBuffer, {
          createFolders: false,
        });

      const documentRelsId = docxDocumentInstance.createDocumentRelationships(
        docxDocumentInstance.relationshipFilename,
        imageType,
        `media/${response.fileNameWithExtension}`,
        internalRelationship
      );

      // Add validation before calling sizeOf
      if (!imageBuffer || imageBuffer.length === 0) {
        // eslint-disable-next-line no-console
        console.error(`[ERROR] buildImage: Empty image buffer for ${vNode.properties.src}`);
        return null;
      }

      // Check if we got HTML instead of image data (common with Wikimedia errors)
      const firstBytes = imageBuffer.slice(0, 20).toString('utf8');
      if (firstBytes.startsWith('<!DOCTYPE') || firstBytes.startsWith('<html')) {
        // eslint-disable-next-line no-console
        console.error(
          `[ERROR] buildImage: Received HTML instead of image data for ${vNode.properties.src}`
        );
        return null;
      }

      let imageProperties;

      // For SVG files, use dimensions from vNode properties instead of sizeOf
      // (sizeOf doesn't work on SVG XML content)
      if (response.isSVG) {
        imageProperties = {
          width: vNode.properties.width || 100,
          height: vNode.properties.height || 100,
        };
      } else {
        try {
          imageProperties = sizeOf(imageBuffer);
          if (!imageProperties || !imageProperties.width || !imageProperties.height) {
            // eslint-disable-next-line no-console
            console.error(
              `[ERROR] buildImage: Invalid image properties for ${vNode.properties.src}:`,
              imageProperties
            );
            return null;
          }
        } catch (sizeError) {
          // eslint-disable-next-line no-console
          console.error(
            `[ERROR] buildImage: sizeOf failed for ${vNode.properties.src}:`,
            sizeError.message
          );
          return null;
        }
      }

      const imageFragment = await xmlBuilder.buildParagraph(
        vNode,
        {
          type: 'picture',
          inlineOrAnchored: true,
          relationshipId: documentRelsId,
          ...response,
          description: vNode.properties.alt,
          maximumWidth: maximumWidth || docxDocumentInstance.availableDocumentSpace,
          originalWidth: imageProperties.width,
          originalHeight: imageProperties.height,
        },
        docxDocumentInstance
      );

      return imageFragment;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] buildImage: Error during XML generation:`, error);
      return null;
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] buildImage: No response from createMediaFile`);
    return null;
  }
};
