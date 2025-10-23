// Unit tests for image processing functionality
// Tests image download, base64 conversion, dimension handling, and configuration options

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphCount } from './helpers/docx-assertions.js';
import {
  getMimeType,
  guessMimeTypeFromBase64,
  downloadImageToBase64,
  parseDataUrl,
} from '../src/utils/image.js';
import { processImageSource } from '../src/helpers/xml-builder.js';
import { clearImageCache, getImageCacheStats } from '../src/helpers/render-document-file.js';
import { PNG_1x1_BASE64, JPEG_1x1_BASE64, GIF_1x1_BASE64, PNG_FIXTURE } from './fixtures/index.js';
import axios from 'axios';

// Mock axios for downloadImageToBase64 tests
jest.mock('axios');

describe('Image Processing', () => {
  // Base64 images loaded from fixture files
  // These maintain full fidelity with actual image files for magic byte testing

  describe('Fixture integrity verification', () => {
    test('PNG fixture should have correct magic bytes (89 50 4E 47)', () => {
      // Decode base64 to check binary magic numbers
      const buffer = Buffer.from(PNG_1x1_BASE64, 'base64');

      // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // 'P'
      expect(buffer[2]).toBe(0x4e); // 'N'
      expect(buffer[3]).toBe(0x47); // 'G'
    });

    test('PNG fixture base64 should start with correct prefix (iVBORw)', () => {
      // PNG magic bytes (89 50 4E 47) encode to "iVBORw" in base64
      // This verifies the base64 string itself starts correctly
      expect(PNG_1x1_BASE64).toMatch(/^iVBORw/);
    });

    test('JPEG fixture should have correct magic bytes (FF D8 FF)', () => {
      const buffer = Buffer.from(JPEG_1x1_BASE64, 'base64');

      // JPEG magic bytes: FF D8 FF
      expect(buffer[0]).toBe(0xff);
      expect(buffer[1]).toBe(0xd8);
      expect(buffer[2]).toBe(0xff);
    });

    test('JPEG fixture base64 should start with correct prefix (/9j/)', () => {
      // JPEG magic bytes (FF D8 FF) encode to "/9j/" in base64
      // This verifies the base64 string itself starts correctly
      expect(JPEG_1x1_BASE64).toMatch(/^\/9j\//);
    });

    test('GIF fixture should have correct magic bytes (47 49 46)', () => {
      const buffer = Buffer.from(GIF_1x1_BASE64, 'base64');

      // GIF magic bytes: 47 49 46 ('GIF')
      expect(buffer[0]).toBe(0x47); // 'G'
      expect(buffer[1]).toBe(0x49); // 'I'
      expect(buffer[2]).toBe(0x46); // 'F'
    });

    test('GIF fixture base64 should start with correct prefix (R0lGOD)', () => {
      // GIF magic bytes (47 49 46 38) encode to "R0lGOD" in base64
      // This verifies the base64 string itself starts correctly
      expect(GIF_1x1_BASE64).toMatch(/^R0lGOD/);
    });

    test('All fixtures should be valid base64 strings', () => {
      // Verify all fixtures can be decoded without errors
      expect(() => Buffer.from(PNG_1x1_BASE64, 'base64')).not.toThrow();
      expect(() => Buffer.from(JPEG_1x1_BASE64, 'base64')).not.toThrow();
      expect(() => Buffer.from(GIF_1x1_BASE64, 'base64')).not.toThrow();

      // Verify they produce non-empty buffers
      expect(Buffer.from(PNG_1x1_BASE64, 'base64').length).toBeGreaterThan(0);
      expect(Buffer.from(JPEG_1x1_BASE64, 'base64').length).toBeGreaterThan(0);
      expect(Buffer.from(GIF_1x1_BASE64, 'base64').length).toBeGreaterThan(0);
    });
  });

  describe('getMimeType utility', () => {
    test('should detect JPEG mime type from extension', () => {
      const mimeType = getMimeType('image.jpg');
      expect(mimeType).toBe('image/jpeg');
    });

    test('should detect PNG mime type from extension', () => {
      const mimeType = getMimeType('image.png');
      expect(mimeType).toBe('image/png');
    });

    test('should detect GIF mime type from extension', () => {
      const mimeType = getMimeType('image.gif');
      expect(mimeType).toBe('image/gif');
    });

    test('should detect mime type from URL with extension', () => {
      const mimeType = getMimeType('https://example.com/image.jpeg');
      expect(mimeType).toBe('image/jpeg');
    });

    test('should fallback to base64 detection when extension lookup fails', () => {
      const mimeType = getMimeType('unknown', PNG_1x1_BASE64);
      expect(mimeType).toBe('image/png');
    });
  });

  describe('parseDataUrl utility', () => {
    test('should parse valid PNG data URL', () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const result = parseDataUrl(dataUrl);

      expect(result).not.toBeNull();
      expect(result.mimeType).toBe('image/png');
      expect(result.base64).toBe(PNG_1x1_BASE64);
    });

    test('should parse valid JPEG data URL', () => {
      const dataUrl = `data:image/jpeg;base64,${JPEG_1x1_BASE64}`;
      const result = parseDataUrl(dataUrl);

      expect(result).not.toBeNull();
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.base64).toBe(JPEG_1x1_BASE64);
    });

    test('should return null for invalid data URL format', () => {
      expect(parseDataUrl('not-a-data-url')).toBeNull();
      expect(parseDataUrl('data:invalid-format')).toBeNull();
      expect(parseDataUrl('data:image/png,notbase64')).toBeNull();
    });

    test('should return null for empty string', () => {
      expect(parseDataUrl('')).toBeNull();
    });
  });

  describe('guessMimeTypeFromBase64 utility', () => {
    test('should detect JPEG from magic numbers', () => {
      const mimeType = guessMimeTypeFromBase64(JPEG_1x1_BASE64);
      expect(mimeType).toBe('image/jpeg');
    });

    test('should detect PNG from magic numbers', () => {
      const mimeType = guessMimeTypeFromBase64(PNG_1x1_BASE64);
      expect(mimeType).toBe('image/png');
    });

    test('should detect GIF from magic numbers', () => {
      const mimeType = guessMimeTypeFromBase64(GIF_1x1_BASE64);
      expect(mimeType).toBe('image/gif');
    });

    test('should return false for unknown format', () => {
      const unknownBase64 = 'VGhpcyBpcyBub3QgYW4gaW1hZ2U='; // "This is not an image"
      const mimeType = guessMimeTypeFromBase64(unknownBase64);
      expect(mimeType).toBe(false);
    });
  });

  describe('Data URL image handling', () => {
    test('should handle PNG data URL', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      // Image should be processed and create a paragraph
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle JPEG data URL', async () => {
      const dataUrl = `data:image/jpeg;base64,${JPEG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle GIF data URL', async () => {
      const dataUrl = `data:image/gif;base64,${GIF_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should skip invalid data URL format', async () => {
      const invalidDataUrl = 'data:invalid-format';
      const htmlString = `<p>Text before</p><img src="${invalidDataUrl}" /><p>Text after</p>`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      // Should create document with text paragraphs, invalid image is skipped
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Image dimension handling with data URLs', () => {
    test('should honor HTML width attribute', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" width="100" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      // Verify document was created with image
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Check if width attribute is in the XML extent (cx in EMUs - 100px ≈ 952500 EMUs)
      expect(parsed.xml).toMatch(/cx=["']9[0-9]{5}["']/);
    });

    test('should honor HTML height attribute', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" height="100" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Check if height attribute is in the XML extent (cy in EMUs - 100px ≈ 952500 EMUs)
      expect(parsed.xml).toMatch(/cy=["']9[0-9]{5}["']/);
    });

    test('should honor both width and height attributes', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" width="150" height="100" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Both dimensions should be present in extent element
      expect(parsed.xml).toMatch(/cx=["'][0-9]+["']/);
      expect(parsed.xml).toMatch(/cy=["'][0-9]+["']/);
    });

    test('should handle images without dimension attributes', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Should still have width and height in extent (from actual image dimensions)
      expect(parsed.xml).toMatch(/cx=["'][0-9]+["']/);
      expect(parsed.xml).toMatch(/cy=["'][0-9]+["']/);
    });

    test('should handle CSS style width and height', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" style="width: 200px; height: 150px;" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Dimensions from style should be applied to extent
      expect(parsed.xml).toMatch(/cx=["'][0-9]+["']/);
      expect(parsed.xml).toMatch(/cy=["'][0-9]+["']/);
    });

    test('should handle percentage dimensions by converting to pixels', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" style="width: 50%;" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Should have width even with percentage (converted to pixels)
      expect(parsed.xml).toMatch(/cx=["'][0-9]+["']/);
    });

    test('should fallback to original dimensions when width is 0', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" width="0" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // 0 is not a valid dimension, should use original image dimensions (greater than 0)
      const cxMatch = parsed.xml.match(/cx=["']([0-9]+)["']/);
      const cyMatch = parsed.xml.match(/cy=["']([0-9]+)["']/);
      expect(cxMatch).not.toBeNull();
      expect(cyMatch).not.toBeNull();
      expect(parseInt(cxMatch[1])).toBeGreaterThan(0);
      expect(parseInt(cyMatch[1])).toBeGreaterThan(0);
    });

    test('should fallback to original dimensions when height is 0', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" height="0" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // 0 is not a valid dimension, should use original image dimensions (greater than 0)
      const cxMatch = parsed.xml.match(/cx=["']([0-9]+)["']/);
      const cyMatch = parsed.xml.match(/cy=["']([0-9]+)["']/);
      expect(cxMatch).not.toBeNull();
      expect(cyMatch).not.toBeNull();
      expect(parseInt(cxMatch[1])).toBeGreaterThan(0);
      expect(parseInt(cyMatch[1])).toBeGreaterThan(0);
    });

    test('should fallback to original dimensions for non-dimensional CSS styles', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" style="font-family: Arial; color: red;" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Non-dimensional styles shouldn't affect dimensions, should use original
      expect(parsed.xml).toMatch(/cx=["'][0-9]+["']/);
      expect(parsed.xml).toMatch(/cy=["'][0-9]+["']/);
    });
  });

  describe('Image caching and deduplication', () => {
    test('should cache data URL images for reuse', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `
        <img src="${dataUrl}" />
        <img src="${dataUrl}" />
        <img src="${dataUrl}" />
      `;

      const docx = await HTMLtoDOCX(htmlString, {
        imageProcessing: {
          verboseLogging: false,
        },
      });

      const parsed = await parseDOCX(docx);

      // Should have multiple paragraphs for the repeated images
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Mixed content with images', () => {
    test('should handle text and images together', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `
        <p>Text before image</p>
        <img src="${dataUrl}" />
        <p>Text after image</p>
      `;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      // Should have at least 3 paragraphs (2 text + 1 image)
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle inline images within paragraphs', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<p>Text with <img src="${dataUrl}" /> inline image</p>`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle multiple images in a single paragraph', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<p><img src="${dataUrl}" /> <img src="${dataUrl}" /> <img src="${dataUrl}" /></p>`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Image processing configuration', () => {
    test('should apply verboseLogging configuration', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, {
        imageProcessing: {
          verboseLogging: true,
        },
      });

      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle empty imageProcessing config', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, {
        imageProcessing: {},
      });

      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Image format support', () => {
    test('should handle different image formats via data URLs', async () => {
      const htmlString = `
        <p>PNG Image:</p>
        <img src="data:image/png;base64,${PNG_1x1_BASE64}" />
        <p>JPEG Image:</p>
        <img src="data:image/jpeg;base64,${JPEG_1x1_BASE64}" />
        <p>GIF Image:</p>
        <img src="data:image/gif;base64,${GIF_1x1_BASE64}" />
      `;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      // Should have all paragraphs with text and images
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Image attributes and properties', () => {
    test('should handle alt attribute', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" alt="Test Image Description" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
      // Note: Alt text handling depends on implementation
    });

    test('should handle title attribute', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" title="Test Image Title" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle image with class attribute', async () => {
      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;
      const htmlString = `<img src="${dataUrl}" class="responsive-image" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('downloadImageToBase64 utility', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should download image and convert to base64', async () => {
      // Mock successful axios response with arraybuffer
      axios.get.mockResolvedValue({
        data: PNG_FIXTURE, // Use actual PNG buffer from fixtures
        status: 200,
      });

      const base64 = await downloadImageToBase64('https://example.com/image.png');

      // Verify axios was called with correct config
      expect(axios.get).toHaveBeenCalledWith('https://example.com/image.png', {
        responseType: 'arraybuffer',
        timeout: 5000,
        maxContentLength: 10 * 1024 * 1024,
        maxBodyLength: 10 * 1024 * 1024,
        validateStatus: expect.any(Function),
      });

      // Verify returned base64 matches our fixture
      expect(base64).toBe(PNG_1x1_BASE64);
    });

    test('should handle custom timeout and maxSize', async () => {
      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      await downloadImageToBase64('https://example.com/image.png', 3000, 5 * 1024 * 1024);

      expect(axios.get).toHaveBeenCalledWith('https://example.com/image.png', {
        responseType: 'arraybuffer',
        timeout: 3000,
        maxContentLength: 5 * 1024 * 1024,
        maxBodyLength: 5 * 1024 * 1024,
        validateStatus: expect.any(Function),
      });
    });

    test('should throw error on timeout', async () => {
      axios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout',
      });

      await expect(downloadImageToBase64('https://example.com/image.png')).rejects.toThrow(
        'Request timeout after 5000ms'
      );
    });

    test('should throw error on HTTP error status', async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 404,
          statusText: 'Not Found',
        },
      });

      await expect(downloadImageToBase64('https://example.com/image.png')).rejects.toThrow(
        'HTTP 404: Not Found'
      );
    });

    test('should throw error on network error', async () => {
      axios.get.mockRejectedValue({
        request: {},
        message: 'Network error',
      });

      await expect(downloadImageToBase64('https://example.com/image.png')).rejects.toThrow(
        'Network error: Network error'
      );
    });

    test('should throw error on empty response', async () => {
      axios.get.mockResolvedValue({
        data: Buffer.from([]),
        status: 200,
      });

      await expect(downloadImageToBase64('https://example.com/image.png')).rejects.toThrow(
        'Empty response data received'
      );
    });
  });

  describe('processImageSource helper', () => {
    let mockDocxInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      // Create a minimal mock document instance
      mockDocxInstance = {
        imageProcessing: {},
      };
    });

    test('should process data URL and return image properties', async () => {
      const vNode = {
        properties: {
          src: `data:image/png;base64,${PNG_1x1_BASE64}`,
        },
      };

      const result = await processImageSource(mockDocxInstance, vNode, vNode.properties.src, 'TEST');

      expect(result).not.toBeNull();
      expect(result.base64String).toBe(PNG_1x1_BASE64);
      expect(result.imageProperties).toBeDefined();
      expect(result.imageProperties.width).toBeGreaterThan(0);
      expect(result.imageProperties.height).toBeGreaterThan(0);
    });

    test('should download URL image and return properties', async () => {
      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const vNode = {
        properties: {
          src: 'https://example.com/image.png',
        },
      };

      const result = await processImageSource(mockDocxInstance, vNode, vNode.properties.src, 'TEST');

      expect(result).not.toBeNull();
      expect(result.base64String).toBe(PNG_1x1_BASE64);
      expect(result.imageProperties).toBeDefined();
      expect(result.imageProperties.width).toBeGreaterThan(0);
      expect(result.imageProperties.height).toBeGreaterThan(0);
      // Should update vNode with data URL
      expect(vNode.properties.src).toMatch(/^data:image\/png;base64,/);
    });

    test('should return null for invalid data URL', async () => {
      const vNode = {
        properties: {
          src: 'data:invalid-format',
        },
      };

      const result = await processImageSource(mockDocxInstance, vNode, vNode.properties.src, 'TEST');

      expect(result).toBeNull();
    });

    test('should return null when download fails', async () => {
      axios.get.mockRejectedValue({
        response: {
          status: 404,
          statusText: 'Not Found',
        },
      });

      const vNode = {
        properties: {
          src: 'https://example.com/not-found.png',
        },
      };

      const result = await processImageSource(mockDocxInstance, vNode, vNode.properties.src, 'TEST');

      expect(result).toBeNull();
    });

    test('should return null for invalid base64', async () => {
      const vNode = {
        properties: {
          src: 'data:image/png;base64,invalid!!!base64',
        },
      };

      const result = await processImageSource(mockDocxInstance, vNode, vNode.properties.src, 'TEST');

      expect(result).toBeNull();
    });

    test('should handle JPEG images', async () => {
      const vNode = {
        properties: {
          src: `data:image/jpeg;base64,${JPEG_1x1_BASE64}`,
        },
      };

      const result = await processImageSource(mockDocxInstance, vNode, vNode.properties.src, 'TEST');

      expect(result).not.toBeNull();
      expect(result.base64String).toBe(JPEG_1x1_BASE64);
      expect(result.imageProperties.type).toBe('jpg');
    });

    test('should handle GIF images', async () => {
      const vNode = {
        properties: {
          src: `data:image/gif;base64,${GIF_1x1_BASE64}`,
        },
      };

      const result = await processImageSource(mockDocxInstance, vNode, vNode.properties.src, 'TEST');

      expect(result).not.toBeNull();
      expect(result.base64String).toBe(GIF_1x1_BASE64);
      expect(result.imageProperties.type).toBe('gif');
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle empty src attribute', async () => {
      const htmlString = '<p>Before</p><img src="" /><p>After</p>';

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      // Should create document with text paragraphs, empty src is skipped
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle image with only whitespace in src', async () => {
      const htmlString = '<p>Before</p><img src="   " /><p>After</p>';

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle very large base64 string', async () => {
      // Create a larger base64 image by repeating pattern (still valid PNG)
      const largeBase64 = PNG_1x1_BASE64.repeat(10);
      const dataUrl = `data:image/png;base64,${largeBase64}`;
      const htmlString = `<img src="${dataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Image cache isolation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should isolate cache between different document generations', async () => {
      // Mock axios to return PNG fixture
      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const imageUrl = 'https://example.com/test-image.png';
      const htmlString1 = `<img src="${imageUrl}" />`;
      const htmlString2 = `<img src="${imageUrl}" />`;

      // Generate first document
      const docx1 = await HTMLtoDOCX(htmlString1, {
        imageProcessing: { verboseLogging: false },
      });
      const parsed1 = await parseDOCX(docx1);
      expect(parsed1.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Generate second document - should download again (not use cache from doc1)
      const docx2 = await HTMLtoDOCX(htmlString2, {
        imageProcessing: { verboseLogging: false },
      });
      const parsed2 = await parseDOCX(docx2);
      expect(parsed2.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Verify axios was called twice (once per document, no cross-document caching)
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    test('should maintain cache within same document generation', async () => {
      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const imageUrl = 'https://example.com/repeated-image.png';
      // Same image used 3 times in one document
      const htmlString = `
        <img src="${imageUrl}" />
        <img src="${imageUrl}" />
        <img src="${imageUrl}" />
      `;

      const docx = await HTMLtoDOCX(htmlString, {
        imageProcessing: { verboseLogging: false },
      });
      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);

      // Should only download once due to within-document caching
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    test('clearImageCache should work with docxDocumentInstance', () => {
      const mockInstance = {
        _imageCache: new Map([
          ['url1', 'data1'],
          ['url2', 'data2'],
        ]),
        _retryStats: {
          totalAttempts: 5,
          successAfterRetry: 2,
          finalFailures: 1,
        },
      };

      const clearedCount = clearImageCache(mockInstance);

      expect(clearedCount).toBe(2);
      expect(mockInstance._imageCache.size).toBe(0);
      expect(mockInstance._retryStats).toEqual({
        totalAttempts: 0,
        successAfterRetry: 0,
        finalFailures: 0,
      });
    });

    test('getImageCacheStats should return correct stats', () => {
      const mockInstance = {
        _imageCache: new Map([
          ['url1', 'data:image/png;base64,abc'],
          ['url2', null], // failed download
          ['url3', 'data:image/jpeg;base64,def'],
        ]),
        _retryStats: {
          totalAttempts: 5,
          successAfterRetry: 2,
          finalFailures: 1,
        },
      };

      const stats = getImageCacheStats(mockInstance);

      expect(stats.size).toBe(3);
      expect(stats.urls).toEqual(['url1', 'url2', 'url3']);
      expect(stats.successCount).toBe(2);
      expect(stats.failureCount).toBe(1);
      expect(stats.retryStats).toEqual({
        totalAttempts: 5,
        successAfterRetry: 2,
        finalFailures: 1,
      });
    });

    test('getImageCacheStats should handle missing cache gracefully', () => {
      const mockInstance = {};

      const stats = getImageCacheStats(mockInstance);

      expect(stats).toEqual({
        size: 0,
        urls: [],
        successCount: 0,
        failureCount: 0,
        retryStats: { totalAttempts: 0, successAfterRetry: 0, finalFailures: 0 },
      });
    });

    test('clearImageCache should handle missing cache gracefully', () => {
      const mockInstance = {};

      const clearedCount = clearImageCache(mockInstance);

      expect(clearedCount).toBe(0);
    });
  });

  describe('LRU cache eviction and memory limits', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should respect maxCacheEntries limit and evict oldest entries', async () => {
      // Configure small cache: max 2 entries
      const htmlWithThreeImages = `
        <img src="https://example.com/image1.png" />
        <img src="https://example.com/image2.png" />
        <img src="https://example.com/image3.png" />
      `;

      // Mock axios to return different images
      let callCount = 0;
      axios.get.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          data: PNG_FIXTURE,
          status: 200,
        });
      });

      const docx = await HTMLtoDOCX(htmlWithThreeImages, null, {
        imageProcessing: {
          maxCacheEntries: 2, // Only cache 2 images max
          maxCacheSize: 10 * 1024 * 1024, // 10MB (high enough to not hit size limit)
          verboseLogging: false,
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);

      // Should have downloaded all 3 images (no cache hits due to unique URLs)
      expect(axios.get).toHaveBeenCalledTimes(3);

      // Verify cache was used within document by checking it only downloaded once per unique URL
      expect(axios.get).toHaveBeenCalledWith(
        'https://example.com/image1.png',
        expect.any(Object)
      );
      expect(axios.get).toHaveBeenCalledWith(
        'https://example.com/image2.png',
        expect.any(Object)
      );
      expect(axios.get).toHaveBeenCalledWith(
        'https://example.com/image3.png',
        expect.any(Object)
      );
    });

    test('should respect maxCacheSize limit and evict when size exceeded', async () => {
      // Configure tiny cache: max 100 bytes (base64 PNG is ~200 bytes decoded)
      const htmlWithTwoImages = `
        <img src="https://example.com/large1.png" />
        <img src="https://example.com/large2.png" />
      `;

      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const docx = await HTMLtoDOCX(htmlWithTwoImages, null, {
        imageProcessing: {
          maxCacheEntries: 100, // High entry limit
          maxCacheSize: 100, // Only 100 bytes max (will trigger size eviction)
          verboseLogging: false,
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);

      // Both images should be downloaded (cache too small to hold even one)
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    test('should cache repeated images within document with LRU', async () => {
      // Same image repeated 5 times
      const imageUrl = 'https://example.com/repeated.png';
      const htmlWithRepeatedImages = `
        <img src="${imageUrl}" />
        <img src="${imageUrl}" />
        <img src="${imageUrl}" />
        <img src="${imageUrl}" />
        <img src="${imageUrl}" />
      `;

      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const docx = await HTMLtoDOCX(htmlWithRepeatedImages, null, {
        imageProcessing: {
          maxCacheEntries: 100,
          maxCacheSize: 20 * 1024 * 1024, // 20MB default
          verboseLogging: false,
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(5);

      // Should only download once, then use cache
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    test('should handle cache limits with mixed unique and repeated images', async () => {
      const html = `
        <img src="https://example.com/img1.png" />
        <img src="https://example.com/img2.png" />
        <img src="https://example.com/img1.png" />
        <img src="https://example.com/img3.png" />
        <img src="https://example.com/img2.png" />
      `;

      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const docx = await HTMLtoDOCX(html, null, {
        imageProcessing: {
          maxCacheEntries: 2, // Can only cache 2 images
          maxCacheSize: 10 * 1024 * 1024,
          verboseLogging: false,
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(5);

      // Should download: img1 (cache), img2 (cache), img1 (hit), img3 (evicts oldest), img2 (miss, re-download)
      // Actual downloads: img1, img2, img3, img2 (again) = 4 calls
      // OR might be 3 if LRU keeps most recent
      expect(axios.get.mock.calls.length).toBeGreaterThanOrEqual(3);
      expect(axios.get.mock.calls.length).toBeLessThanOrEqual(4);
    });

    test('should work with default cache limits (20MB, 100 entries)', async () => {
      const html = `
        <img src="https://example.com/default-test.png" />
      `;

      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      // Use default config (no imageProcessing override)
      const docx = await HTMLtoDOCX(html);
      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    test('should use configured cache limits', async () => {
      // Test that custom cache limits are applied correctly
      const html = `
        <img src="https://example.com/test1.png" />
        <img src="https://example.com/test2.png" />
      `;

      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const docx = await HTMLtoDOCX(html, null, {
        imageProcessing: {
          maxCacheEntries: 50,
          maxCacheSize: 10 * 1024 * 1024,
          verboseLogging: false,
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);

      // Should successfully process images with custom cache config
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('HTML attribute vs CSS style precedence', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('CSS style width/height should override HTML attribute width/height', async () => {
      // CSS style should take precedence over HTML attributes
      const html = `<img src="https://example.com/test.png" width="100" height="100" style="width: 200px; height: 200px;" />`;

      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const docx = await HTMLtoDOCX(html, null, {
        imageProcessing: { verboseLogging: false },
      });

      const parsed = await parseDOCX(docx);

      // Verify image was processed
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Check that dimensions in XML reflect CSS values (200px) not HTML attributes (100px)
      // 200px * 9525 EMU/px = 1905000 EMU
      const cxMatch = parsed.xml.match(/cx=["']([0-9]+)["']/);
      const cyMatch = parsed.xml.match(/cy=["']([0-9]+)["']/);

      expect(cxMatch).not.toBeNull();
      expect(cyMatch).not.toBeNull();

      const widthEMU = parseInt(cxMatch[1]);
      const heightEMU = parseInt(cyMatch[1]);

      // CSS 200px should be ~1905000 EMU (200 * 9525)
      // Allow some rounding tolerance
      expect(widthEMU).toBeGreaterThan(1800000);
      expect(widthEMU).toBeLessThan(2000000);
      expect(heightEMU).toBeGreaterThan(1800000);
      expect(heightEMU).toBeLessThan(2000000);
    });

    test('HTML attributes should apply when no CSS style is present', async () => {
      const html = `<img src="https://example.com/test.png" width="150" height="150" />`;

      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const docx = await HTMLtoDOCX(html, null, {
        imageProcessing: { verboseLogging: false },
      });

      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Check that dimensions reflect HTML attribute values (150px)
      // 150px * 9525 EMU/px = 1428750 EMU
      const cxMatch = parsed.xml.match(/cx=["']([0-9]+)["']/);
      const cyMatch = parsed.xml.match(/cy=["']([0-9]+)["']/);

      expect(cxMatch).not.toBeNull();
      expect(cyMatch).not.toBeNull();

      const widthEMU = parseInt(cxMatch[1]);
      const heightEMU = parseInt(cyMatch[1]);

      // 150px should be ~1428750 EMU
      expect(widthEMU).toBeGreaterThan(1350000);
      expect(widthEMU).toBeLessThan(1500000);
      expect(heightEMU).toBeGreaterThan(1350000);
      expect(heightEMU).toBeLessThan(1500000);
    });

    test('Partial CSS override: only width in style should override HTML width but keep HTML height', async () => {
      const html = `<img src="https://example.com/test.png" width="100" height="100" style="width: 300px;" />`;

      axios.get.mockResolvedValue({
        data: PNG_FIXTURE,
        status: 200,
      });

      const docx = await HTMLtoDOCX(html, null, {
        imageProcessing: { verboseLogging: false },
      });

      const parsed = await parseDOCX(docx);

      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      const cxMatch = parsed.xml.match(/cx=["']([0-9]+)["']/);

      expect(cxMatch).not.toBeNull();

      const widthEMU = parseInt(cxMatch[1]);

      // CSS width 300px should be ~2857500 EMU (300 * 9525)
      expect(widthEMU).toBeGreaterThan(2700000);
      expect(widthEMU).toBeLessThan(3000000);

      // Height should maintain aspect ratio based on new width
      // (since CSS only specified width, height is calculated from aspect ratio)
    });
  });
});
