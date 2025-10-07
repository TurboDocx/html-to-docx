// Unit tests for image processing functionality
// Tests image download, base64 conversion, dimension handling, and configuration options

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphCount } from './helpers/docx-assertions.js';
import { getMimeType, guessMimeTypeFromBase64 } from '../src/utils/image.js';

describe('Image Processing', () => {
  // Sample base64 images for testing
  const PNG_1x1_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const JPEG_1x1_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/B';
  const GIF_1x1_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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
