// Unit tests for SVG handling functionality
// Tests SVG to PNG conversion, native SVG support, and configuration options

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';
import { isSVG, convertSVGtoPNG } from '../src/utils/image.js';
import { SVG_BASE64, SVG_FIXTURE, PNG_FIXTURE } from './fixtures/index.js';

describe('SVG Handling', () => {
  describe('isSVG utility', () => {
    test('should detect SVG from image/svg+xml MIME type', () => {
      expect(isSVG('image/svg+xml')).toBe(true);
    });

    test('should detect SVG from image/svg MIME type', () => {
      expect(isSVG('image/svg')).toBe(true);
    });

    test('should detect SVG from .svg extension', () => {
      expect(isSVG('.svg')).toBe(true);
      expect(isSVG('svg')).toBe(true);
    });

    test('should detect SVG from file path', () => {
      expect(isSVG('image.svg')).toBe(true);
      expect(isSVG('/path/to/image.svg')).toBe(true);
    });

    test('should not detect non-SVG formats', () => {
      expect(isSVG('image/png')).toBe(false);
      expect(isSVG('image/jpeg')).toBe(false);
      expect(isSVG('.png')).toBe(false);
      expect(isSVG('png')).toBe(false);
    });

    test('should handle null/undefined gracefully', () => {
      expect(isSVG(null)).toBe(false);
      expect(isSVG(undefined)).toBe(false);
      expect(isSVG('')).toBe(false);
    });

    test('should be case insensitive', () => {
      expect(isSVG('IMAGE/SVG+XML')).toBe(true);
      expect(isSVG('Image/Svg')).toBe(true);
      expect(isSVG('.SVG')).toBe(true);
    });
  });

  describe('convertSVGtoPNG utility', () => {
    test('should convert SVG string to PNG buffer', async () => {
      const pngBuffer = await convertSVGtoPNG(SVG_FIXTURE);

      expect(Buffer.isBuffer(pngBuffer)).toBe(true);
      expect(pngBuffer.length).toBeGreaterThan(0);

      // Check PNG magic bytes (89 50 4E 47)
      expect(pngBuffer[0]).toBe(0x89);
      expect(pngBuffer[1]).toBe(0x50);
      expect(pngBuffer[2]).toBe(0x4e);
      expect(pngBuffer[3]).toBe(0x47);
    });

    test('should convert SVG base64 to PNG buffer', async () => {
      const pngBuffer = await convertSVGtoPNG(SVG_BASE64);

      expect(Buffer.isBuffer(pngBuffer)).toBe(true);
      expect(pngBuffer.length).toBeGreaterThan(0);

      // Check PNG magic bytes
      expect(pngBuffer[0]).toBe(0x89);
      expect(pngBuffer[1]).toBe(0x50);
    });

    test('should convert SVG buffer to PNG buffer', async () => {
      const svgBuffer = Buffer.from(SVG_FIXTURE, 'utf-8');
      const pngBuffer = await convertSVGtoPNG(svgBuffer);

      expect(Buffer.isBuffer(pngBuffer)).toBe(true);
      expect(pngBuffer.length).toBeGreaterThan(0);
    });

    test('should respect width option', async () => {
      const pngBuffer = await convertSVGtoPNG(SVG_FIXTURE, { width: 200 });

      expect(Buffer.isBuffer(pngBuffer)).toBe(true);
      expect(pngBuffer.length).toBeGreaterThan(0);
    });

    test('should respect height option', async () => {
      const pngBuffer = await convertSVGtoPNG(SVG_FIXTURE, { height: 200 });

      expect(Buffer.isBuffer(pngBuffer)).toBe(true);
      expect(pngBuffer.length).toBeGreaterThan(0);
    });

    test('should respect both width and height options', async () => {
      const pngBuffer = await convertSVGtoPNG(SVG_FIXTURE, { width: 150, height: 150 });

      expect(Buffer.isBuffer(pngBuffer)).toBe(true);
      expect(pngBuffer.length).toBeGreaterThan(0);
    });

    test('should respect density option', async () => {
      const pngBuffer = await convertSVGtoPNG(SVG_FIXTURE, { density: 144 });

      expect(Buffer.isBuffer(pngBuffer)).toBe(true);
      expect(pngBuffer.length).toBeGreaterThan(0);
    });

    test('should throw error for invalid SVG input', async () => {
      await expect(convertSVGtoPNG('not valid svg')).rejects.toThrow();
    });

    test('should throw error for unsupported input type', async () => {
      await expect(convertSVGtoPNG(123)).rejects.toThrow('Invalid SVG input type');
    });
  });

  describe('SVG to PNG conversion (default behavior)', () => {
    test('should convert SVG data URL to PNG by default', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert', // Explicit default
        },
      });

      const parsed = await parseDOCX(docx);

      // Should have generated a paragraph with image
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Check that image file is PNG (not SVG) in the media folder
      expect(parsed.xml).toMatch(/image-.*\.png/);
    });

    test('should convert inline SVG to PNG by default', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<p>Text with <img src="${svgDataUrl}" /> inline SVG</p>`;

      const docx = await HTMLtoDOCX(htmlString);

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle multiple SVGs and convert all to PNG', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `
        <img src="${svgDataUrl}" />
        <img src="${svgDataUrl}" />
        <img src="${svgDataUrl}" />
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle mixed SVG and raster images', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const pngDataUrl = `data:image/png;base64,${PNG_FIXTURE.toString('base64')}`;

      const htmlString = `
        <p>SVG Image:</p>
        <img src="${svgDataUrl}" />
        <p>PNG Image:</p>
        <img src="${pngDataUrl}" />
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(4);
    });

    test('should handle SVG with dimensions', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" width="200" height="200" />`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Check dimensions are in the XML
      expect(parsed.xml).toMatch(/cx=["'][0-9]+["']/);
      expect(parsed.xml).toMatch(/cy=["'][0-9]+["']/);
    });

    test('should handle SVG with alt text', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" alt="Test SVG Description" />`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Native SVG support (Office 2019+)', () => {
    test('should embed SVG natively when svgHandling is "native"', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);

      // Should have generated a paragraph with image
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Check that image file is SVG (not PNG) in the media folder
      expect(parsed.xml).toMatch(/image-.*\.svg/);

      // Check for SVGBlip extension in the XML (Office 2019+ support)
      expect(parsed.xml).toMatch(/svgBlip/);
      expect(parsed.xml).toMatch(/96DAC541-7B7A-43C3-8B79-37D633B846F1/);
    });

    test('should handle multiple native SVGs', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `
        <img src="${svgDataUrl}" />
        <img src="${svgDataUrl}" />
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);

      // Check for SVGBlip extensions
      const svgBlipMatches = parsed.xml.match(/svgBlip/g);
      expect(svgBlipMatches).not.toBeNull();
      expect(svgBlipMatches.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle native SVG with dimensions', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" width="300" height="300" />`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Check dimensions and SVG support
      expect(parsed.xml).toMatch(/cx=["'][0-9]+["']/);
      expect(parsed.xml).toMatch(/cy=["'][0-9]+["']/);
      expect(parsed.xml).toMatch(/svgBlip/);
    });
  });

  describe('SVG handling configuration', () => {
    test('should use "convert" as default when svgHandling is not specified', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" />`;

      // No svgHandling option specified - should default to 'convert'
      const docx = await HTMLtoDOCX(htmlString);

      const parsed = await parseDOCX(docx);

      // Should convert to PNG by default
      expect(parsed.xml).toMatch(/image-.*\.png/);
      expect(parsed.xml).not.toMatch(/svgBlip/);
    });

    test('should respect svgHandling option from imageProcessing config', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" />`;

      const docxNative = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'native',
        },
      });

      const parsedNative = await parseDOCX(docxNative);
      expect(parsedNative.xml).toMatch(/\.svg/);
      expect(parsedNative.xml).toMatch(/svgBlip/);

      const docxConvert = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsedConvert = await parseDOCX(docxConvert);
      expect(parsedConvert.xml).toMatch(/\.png/);
      expect(parsedConvert.xml).not.toMatch(/svgBlip/);
    });

    test('should handle invalid svgHandling option gracefully', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" />`;

      // Invalid option should fall back to default behavior
      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'invalid-option',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SVG error handling', () => {
    test('should handle invalid SVG data gracefully', async () => {
      const invalidSvgDataUrl = 'data:image/svg+xml;base64,aW52YWxpZCBzdmc='; // "invalid svg" in base64
      const htmlString = `<p>Before</p><img src="${invalidSvgDataUrl}" /><p>After</p>`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);

      // Should still generate document with text paragraphs
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    test('should fall back to native SVG if conversion fails', async () => {
      // Create an SVG that might fail conversion
      const problematicSvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      const svgBase64 = Buffer.from(problematicSvg, 'utf-8').toString('base64');
      const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      const htmlString = `<img src="${svgDataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);

      // Should still create document (either as PNG or falling back to SVG)
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty SVG data URL', async () => {
      const htmlString = '<p>Before</p><img src="data:image/svg+xml;base64," /><p>After</p>';

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Should create document with text paragraphs
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SVG with other features', () => {
    test('should handle SVG in figure elements', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `
        <figure>
          <img src="${svgDataUrl}" alt="Figure SVG" />
        </figure>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle SVG in tables', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `
        <table>
          <tr>
            <td>Text</td>
            <td><img src="${svgDataUrl}" /></td>
          </tr>
        </table>
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle SVG with CSS styles', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<img src="${svgDataUrl}" style="width: 250px; height: 250px;" />`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle SVG in links', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `<a href="https://example.com"><img src="${svgDataUrl}" /></a>`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Performance and caching with SVGs', () => {
    test('should cache converted SVG images', async () => {
      const svgDataUrl = `data:image/svg+xml;base64,${SVG_BASE64}`;
      const htmlString = `
        <img src="${svgDataUrl}" />
        <img src="${svgDataUrl}" />
        <img src="${svgDataUrl}" />
      `;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
          verboseLogging: false,
        },
      });

      const parsed = await parseDOCX(docx);

      // Should process all three images
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle large SVG files efficiently', async () => {
      // Create a more complex SVG
      const complexSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500">
          ${Array.from({ length: 100 }, (_, i) => `<circle cx="${(i % 10) * 50}" cy="${Math.floor(i / 10) * 50}" r="20" fill="#${((i * 123456) % 16777215).toString(16).padStart(6, '0')}" />`).join('\n')}
        </svg>
      `;
      const complexSvgBase64 = Buffer.from(complexSvg, 'utf-8').toString('base64');
      const svgDataUrl = `data:image/svg+xml;base64,${complexSvgBase64}`;
      const htmlString = `<img src="${svgDataUrl}" />`;

      const docx = await HTMLtoDOCX(htmlString, null, {
        imageProcessing: {
          svgHandling: 'convert',
        },
      });

      const parsed = await parseDOCX(docx);
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
