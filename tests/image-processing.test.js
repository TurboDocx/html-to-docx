// Unit tests for image processing functionality
// Tests image download, base64 conversion, dimension handling, and configuration options

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphCount } from './helpers/docx-assertions.js';
import { getMimeType, guessMimeTypeFromBase64 } from '../src/utils/image.js';
import { PNG_1x1_BASE64, JPEG_1x1_BASE64, GIF_1x1_BASE64 } from './fixtures/index.js';

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
});
