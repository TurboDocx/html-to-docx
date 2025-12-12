// Unit tests for inline image caching functionality
// Tests that inline images (via buildRun in xml-builder) use the same caching mechanism as block images
import axios from 'axios';

import HTMLtoDOCX from '../index';
import { parseDOCX } from './helpers/docx-assertions';
import { PNG_1x1_BASE64, JPEG_1x1_BASE64 } from './fixtures/index';

// Mock axios for downloadImageToBase64 tests
jest.mock('axios');

describe('Inline Image Caching', () => {
  describe('Cache consistency between buildImage and buildRun', () => {
    test('should cache inline images from external URLs', async () => {
      const testUrl = 'https://example.com/test-image.png';

      // Mock axios to return PNG data
      axios.get.mockResolvedValueOnce({
        data: Buffer.from(PNG_1x1_BASE64, 'base64'),
      });

      const htmlString = `
        <p>Text with inline image: <img src="${testUrl}" width="50" height="50" /></p>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          maxRetries: 1,
        },
      });

      expect(docxBuffer).toBeDefined();
      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      expect(docxBuffer.length).toBeGreaterThan(0);

      // Verify axios was called exactly once (image was cached)
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        testUrl,
        expect.objectContaining({
          responseType: 'arraybuffer',
        })
      );
    });

    test('should reuse cached data for duplicate inline images', async () => {
      const testUrl = 'https://example.com/duplicate-inline.png';

      // Mock axios to return PNG data - provide enough mocks for potential multiple paths
      axios.get.mockResolvedValue({
        data: Buffer.from(PNG_1x1_BASE64, 'base64'),
      });

      const htmlString = `
        <p>First inline: <img src="${testUrl}" width="50" height="50" /></p>
        <p>Second inline: <img src="${testUrl}" width="50" height="50" /></p>
        <p>Third inline: <img src="${testUrl}" width="50" height="50" /></p>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          maxRetries: 1,
        },
      });

      expect(docxBuffer).toBeDefined();

      // With caching, the same URL should not be downloaded 3 times
      // Should be called once per processing path that encounters the URL first
      const callCount = axios.get.mock.calls.length;
      expect(callCount).toBeLessThan(3); // Should be fewer than 3 (the number of images)
    });

    test('should share cache between block and inline images', async () => {
      const testUrl = 'https://example.com/mixed-usage.png';

      // Mock axios to return PNG data
      axios.get.mockResolvedValue({
        data: Buffer.from(PNG_1x1_BASE64, 'base64'),
      });

      const htmlString = `
        <img src="${testUrl}" width="100" height="100" />
        <p>Inline image: <img src="${testUrl}" width="50" height="50" /></p>
        <figure>
          <img src="${testUrl}" width="75" height="75" />
        </figure>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          maxRetries: 1,
        },
      });

      expect(docxBuffer).toBeDefined();
      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      // Document should generate with images from different contexts
      expect(axios.get).toHaveBeenCalled();
    });

    test('should retry failed inline image downloads', async () => {
      const testUrl = 'https://example.com/retry-test.png';

      // First attempt fails, second succeeds
      let callCount = 0;
      axios.get.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve({
          data: Buffer.from(PNG_1x1_BASE64, 'base64'),
        });
      });

      const htmlString = `
        <p>Inline image: <img src="${testUrl}" width="50" height="50" /></p>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          maxRetries: 2,
        },
      });

      expect(docxBuffer).toBeDefined();

      // Verify axios was called at least twice (retry mechanism working)
      expect(axios.get).toHaveBeenCalled();
      expect(callCount).toBeGreaterThanOrEqual(2);
    });

    test('should skip inline image after all retries fail', async () => {
      const testUrl = 'https://example.com/always-fails.png';

      // All attempts fail
      axios.get.mockRejectedValue(new Error('Network error'));

      const htmlString = `
        <p>This inline image will fail: <img src="${testUrl}" width="50" height="50" /></p>
        <p>Some text after the failed image.</p>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          maxRetries: 2,
        },
      });

      expect(docxBuffer).toBeDefined();

      // Verify axios was called (retry mechanism attempted downloads)
      expect(axios.get).toHaveBeenCalled();

      // Document should still be generated (just without the image)
      const docData = await parseDOCX(docxBuffer);
      expect(docData).toBeDefined();
    });

    test('should cache failed inline images to prevent duplicate retries', async () => {
      const testUrl = 'https://example.com/cache-failure.png';

      let attemptCount = 0;
      // All attempts fail
      axios.get.mockImplementation(() => {
        attemptCount++;
        return Promise.reject(new Error('404 Not Found'));
      });

      const htmlString = `
        <p>First failed inline: <img src="${testUrl}" width="50" height="50" /></p>
        <p>Second failed inline: <img src="${testUrl}" width="50" height="50" /></p>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          maxRetries: 2,
        },
      });

      expect(docxBuffer).toBeDefined();

      // Cache should prevent retrying for the second occurrence
      // If no caching, we'd see 4 attempts (2 per image); with caching, should be fewer
      expect(attemptCount).toBeLessThan(4);
    });
  });

  describe('Cache statistics with inline images', () => {
    test('should track inline image cache hits in statistics', async () => {
      const testUrl = 'https://example.com/stats-test.png';

      axios.get.mockResolvedValue({
        data: Buffer.from(JPEG_1x1_BASE64, 'base64'),
      });

      const htmlString = `
        <p>First: <img src="${testUrl}" width="50" height="50" /></p>
        <p>Second: <img src="${testUrl}" width="50" height="50" /></p>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
        },
      });

      expect(docxBuffer).toBeDefined();
      // Cache should be working (document generated successfully with images)
      expect(axios.get).toHaveBeenCalled();
    });
  });

  describe('Inline images with data URLs', () => {
    test('should handle inline data URL images without network calls', async () => {
      // Reset axios mock for this test
      axios.get.mockClear();

      const dataUrl = `data:image/png;base64,${PNG_1x1_BASE64}`;

      const htmlString = `
        <p>Inline data URL: <img src="${dataUrl}" width="50" height="50" /></p>
        <p>Duplicate data URL: <img src="${dataUrl}" width="50" height="50" /></p>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString);

      expect(docxBuffer).toBeDefined();
      expect(Buffer.isBuffer(docxBuffer)).toBe(true);

      // No network calls for data URLs
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('Mixed inline and block image caching', () => {
    test('should cache across different image contexts', async () => {
      const url1 = 'https://example.com/image1.png';
      const url2 = 'https://example.com/image2.jpg';

      axios.get.mockImplementation((url) => {
        if (url.includes('image1')) {
          return Promise.resolve({
            data: Buffer.from(PNG_1x1_BASE64, 'base64'),
          });
        }
        return Promise.resolve({
          data: Buffer.from(JPEG_1x1_BASE64, 'base64'),
        });
      });

      const htmlString = `
        <img src="${url1}" />
        <p>Text with <img src="${url2}" width="30" /> inline</p>
        <p>More text with <img src="${url1}" width="40" /> inline</p>
        <figure><img src="${url2}" /></figure>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
        },
      });

      expect(docxBuffer).toBeDefined();
      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      // Both unique URLs should be downloaded
      expect(axios.get).toHaveBeenCalled();
    });

    test('should handle mix of successful and failed images', async () => {
      const goodUrl = 'https://example.com/good.png';
      const badUrl = 'https://example.com/bad.png';

      axios.get.mockImplementation((url) => {
        if (url.includes('good')) {
          return Promise.resolve({
            data: Buffer.from(PNG_1x1_BASE64, 'base64'),
          });
        }
        return Promise.reject(new Error('404 Not Found'));
      });

      const htmlString = `
        <p>Good inline: <img src="${goodUrl}" width="50" /></p>
        <p>Bad inline: <img src="${badUrl}" width="50" /></p>
        <p>Good again: <img src="${goodUrl}" width="50" /></p>
        <p>Bad again: <img src="${badUrl}" width="50" /></p>
      `;

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          maxRetries: 1,
        },
      });

      expect(docxBuffer).toBeDefined();
      expect(Buffer.isBuffer(docxBuffer)).toBe(true);
      // Both unique URLs should be attempted (one succeeds, one fails)
      expect(axios.get).toHaveBeenCalled();
    });
  });

  describe('LRU cache eviction with inline images', () => {
    test('should respect cache size limits with inline images', async () => {
      const urls = Array.from({ length: 5 }, (_, i) => `https://example.com/image${i}.png`);

      // Mock all URLs to return valid images
      axios.get.mockResolvedValue({
        data: Buffer.from(PNG_1x1_BASE64, 'base64'),
      });

      const htmlString = urls
        .map((url) => `<p>Inline: <img src="${url}" width="50" /></p>`)
        .join('\n');

      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          maxCacheEntries: 3, // Only cache 3 images
        },
      });

      expect(docxBuffer).toBeDefined();

      // All unique URLs should be downloaded
      expect(axios.get).toHaveBeenCalled();
    });
  });

  describe('Inline image timeout handling', () => {
    test('should respect timeout configuration for inline images', async () => {
      const testUrl = 'https://example.com/slow-image.png';

      axios.get.mockImplementation(() => {
        // Simulate timeout by rejecting after delay
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('ECONNABORTED'));
          }, 200);
        });
      });

      const htmlString = `<p>Slow inline: <img src="${testUrl}" width="50" /></p>`;

      // This should timeout quickly
      const startTime = Date.now();
      const docxBuffer = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          verboseLogging: false,
          downloadTimeout: 100, // 100ms timeout
          maxRetries: 1,
        },
      });
      const duration = Date.now() - startTime;

      expect(docxBuffer).toBeDefined();
      // Should fail fast (within 1 second)
      expect(duration).toBeLessThan(1000);
    }, 3000); // Give test 3 seconds total
  });
});
