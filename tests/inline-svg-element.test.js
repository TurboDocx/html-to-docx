// Unit tests for inline SVG element handling
// Tests inline <svg> tags (not img tags with SVG sources)

import HTMLtoDOCX from '../index';
import { parseDOCX } from './helpers/docx-assertions';

describe('Inline SVG Element Handling', () => {
  describe('Basic inline SVG support', () => {
    test('should handle inline SVG element (not img tag)', async () => {
      const htmlString = `
        <p>Before SVG</p>
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="#3498db" />
        </svg>
        <p>After SVG</p>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);

      // Should create document with paragraphs and SVG as image
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
      // Check that SVG was processed (as either .svg or .png file)
      expect(parsed.xml).toMatch(/image-.*\.(svg|png)/);
    });

    test('should handle inline SVG with convert mode', async () => {
      const htmlString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
          <rect x="10" y="10" width="80" height="80" fill="#e74c3c" />
        </svg>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle multiple inline SVG elements', async () => {
      const htmlString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
          <circle cx="25" cy="25" r="20" fill="red" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
          <circle cx="25" cy="25" r="20" fill="blue" />
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
          <circle cx="25" cy="25" r="20" fill="green" />
        </svg>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle inline SVG with complex nested elements', async () => {
      const htmlString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150">
          <g>
            <rect x="10" y="10" width="80" height="60" fill="#e74c3c" />
            <circle cx="150" cy="40" r="30" fill="#2ecc71" />
            <line x1="10" y1="100" x2="190" y2="100" stroke="#34495e" stroke-width="3" />
          </g>
        </svg>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
      expect(parsed.xml).toMatch(/image-.*\.svg/);
    });

    test('should handle inline SVG with viewBox and no width/height', async () => {
      const htmlString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="#9b59b6" />
        </svg>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Inline SVG in different contexts', () => {
    test('should handle inline SVG in paragraph', async () => {
      const htmlString = `
        <p>
          Text before
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
            <circle cx="25" cy="25" r="20" fill="orange" />
          </svg>
          text after
        </p>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle inline SVG in div', async () => {
      const htmlString = `
        <div>
          <h2>Chart Title</h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="150">
            <rect x="20" y="100" width="30" height="40" fill="#2ecc71"/>
          </svg>
        </div>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Mixed SVG types', () => {
    test('should handle both inline SVG and img tags with SVG sources', async () => {
      const svgBase64 = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="20" fill="red" /></svg>',
        'utf-8'
      ).toString('base64');
      const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

      const htmlString = `
        <p>IMG tag with SVG:</p>
        <img src="${svgDataUrl}" alt="SVG via img" />
        <p>Inline SVG element:</p>
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
          <circle cx="25" cy="25" r="20" fill="blue" />
        </svg>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(4);
      // Should have SVG files for both types
      expect(parsed.xml).toMatch(/image-.*\.svg/);
    });
  });

  describe('Error handling', () => {
    test('should handle empty inline SVG gracefully', async () => {
      const htmlString = `
        <p>Before</p>
        <svg xmlns="http://www.w3.org/2000/svg"></svg>
        <p>After</p>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      // Should still create document with text paragraphs
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle inline SVG without xmlns', async () => {
      const htmlString = `
        <svg width="100" height="100">
          <circle cx="50" cy="50" r="40" fill="purple" />
        </svg>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
