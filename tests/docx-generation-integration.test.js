/**
 * Integration tests for HTML to DOCX generation
 * Tests that the htmlparser2 upgrade doesn't break DOCX generation
 */

import HTMLtoDOCX from '../index.js';

describe('DOCX Generation Integration Tests', () => {
  describe('Basic HTML elements', () => {
    test('should generate DOCX from simple paragraph', async () => {
      const html = '<p>Hello World</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx instanceof Uint8Array).toBe(true);
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX from multiple paragraphs', async () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX from headings', async () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><p>Content</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX from lists', async () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX from ordered lists', async () => {
      const html = '<ol><li>First</li><li>Second</li><li>Third</li></ol>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });

  describe('Styled content', () => {
    test('should generate DOCX with inline styles', async () => {
      const html = '<p style="color: red; font-size: 16px;">Styled text</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with bold text', async () => {
      const html = '<p>Normal <strong>bold</strong> text</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with italic text', async () => {
      const html = '<p>Normal <em>italic</em> text</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with underlined text', async () => {
      const html = '<p>Normal <u>underlined</u> text</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });

  describe('Tables', () => {
    test('should generate DOCX with simple table', async () => {
      const html = `
        <table>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
          <tr>
            <td>Cell 3</td>
            <td>Cell 4</td>
          </tr>
        </table>
      `;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with table headers', async () => {
      const html = `
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Data 1</td>
              <td>Data 2</td>
            </tr>
          </tbody>
        </table>
      `;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with colspan', async () => {
      const html = `
        <table>
          <tr>
            <td colspan="2">Merged Cell</td>
          </tr>
          <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
          </tr>
        </table>
      `;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with rowspan', async () => {
      const html = `
        <table>
          <tr>
            <td rowspan="2">Tall Cell</td>
            <td>Cell 1</td>
          </tr>
          <tr>
            <td>Cell 2</td>
          </tr>
        </table>
      `;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with styled table', async () => {
      const html = `
        <table style="border: 1px solid black;">
          <tr>
            <td style="background-color: #f0f0f0;">Styled Cell</td>
          </tr>
        </table>
      `;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });

  describe('Images', () => {
    test('should generate DOCX with base64 image', async () => {
      // Small 1x1 transparent PNG
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `<img src="data:image/png;base64,${base64}" />`;

      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with image width and height', async () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `<img src="data:image/png;base64,${base64}" width="100" height="100" />`;

      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with image style dimensions', async () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `<img src="data:image/png;base64,${base64}" style="width: 512px; height: 400px;" />`;

      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });

  describe('Links', () => {
    test('should generate DOCX with hyperlink', async () => {
      const html = '<a href="https://example.com">Click here</a>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with styled hyperlink', async () => {
      const html = '<a href="https://example.com" style="color: blue; text-decoration: underline;">Link</a>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });

  describe('Special characters and entities', () => {
    test('should generate DOCX with HTML entities', async () => {
      const html = '<p>&lt;html&gt; &amp; &quot;quotes&quot;</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with nbsp', async () => {
      const html = '<p>Hello&nbsp;World</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with Unicode characters', async () => {
      const html = '<p>Hello 世界 🌍</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with special punctuation', async () => {
      const html = '<p>Em dash — En dash – Quotes</p>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });

  describe('Complex structures', () => {
    test('should generate DOCX with nested elements', async () => {
      const html = `
        <div>
          <h1>Document Title</h1>
          <p>Introduction paragraph</p>
          <div>
            <h2>Section 1</h2>
            <p>Section content</p>
            <ul>
              <li>Point 1</li>
              <li>Point 2</li>
            </ul>
          </div>
        </div>
      `;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with table inside div', async () => {
      const html = `
        <div>
          <p>Table below:</p>
          <table>
            <tr>
              <td>Cell 1</td>
              <td>Cell 2</td>
            </tr>
          </table>
        </div>
      `;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with mixed content', async () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `
        <h1>Report Title</h1>
        <p>This is a <strong>comprehensive</strong> report with <em>various</em> elements.</p>
        <img src="data:image/png;base64,${base64}" width="100" />
        <table>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Total</td>
            <td>100</td>
          </tr>
        </table>
        <p>Learn more at <a href="https://example.com">example.com</a></p>
      `;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    test('should generate DOCX from empty HTML', async () => {
      const html = '';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX from whitespace-only HTML', async () => {
      const html = '   ';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with very long paragraph', async () => {
      const longText = 'Lorem ipsum dolor sit amet. '.repeat(100);
      const html = `<p>${longText}</p>`;
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });

    test('should generate DOCX with deeply nested structure', async () => {
      const html = '<div><div><div><div><div><p>Deep content</p></div></div></div></div></div>';
      const docx = await HTMLtoDOCX(html);

      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });

  describe('Regression tests for image handling', () => {
    test('should correctly access image src property (not attribute)', async () => {
      // This was the critical bug: src was going to properties.attributes.src
      // instead of properties.src, causing image processing to fail
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `<img src="data:image/png;base64,${base64}" />`;

      // Should not throw error about null.length
      await expect(HTMLtoDOCX(html)).resolves.toBeDefined();
    });

    test('should handle multiple images in document', async () => {
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const html = `
        <p>Image 1:</p>
        <img src="data:image/png;base64,${base64}" />
        <p>Image 2:</p>
        <img src="data:image/png;base64,${base64}" />
      `;

      const docx = await HTMLtoDOCX(html);
      expect(docx).toBeDefined();
      expect(docx.length).toBeGreaterThan(0);
    });
  });
});
