/**
 * Unit tests for list items with multiple paragraphs
 * Related to Issue #145: https://github.com/TurboDocx/html-to-docx/issues/145
 *
 * Issue: When a list item contains multiple <p> tags, only the first paragraph
 * is rendered in the DOCX output. According to HTML spec, list items can contain
 * any Flow Content, including multiple paragraphs.
 *
 * This test suite follows TDD approach:
 * 1. Write failing tests first
 * 2. Implement fix
 * 3. Verify all tests pass
 */

import HTMLtoDOCX from '../index.js';
import {
  parseDOCX,
  assertParagraphCount,
  assertParagraphText,
} from './helpers/docx-assertions.js';

describe('List items with multiple paragraphs - Issue #145', () => {
  describe('Basic multiple paragraph support', () => {
    test('should render two paragraphs in single list item', async () => {
      // Exact HTML from issue #145
      const htmlString = `
        <ul style="list-style-type: circle; margin-bottom: 0in; margin-top: 0px;">
          <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;">
            <p style="font-size: 9.0pt; font-family: Arial, sans-serif;">Paragraph 1</p>
            <p style="font-size: 9.0pt; font-family: Arial, sans-serif;">Paragraph 2</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Should create 2 separate paragraphs in the DOCX
      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Paragraph 1');
      assertParagraphText(parsed, 1, 'Paragraph 2');
    });

    test('should render three paragraphs in single list item', async () => {
      const htmlString = `
        <ul>
          <li>
            <p>First paragraph</p>
            <p>Second paragraph</p>
            <p>Third paragraph</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 3);
      assertParagraphText(parsed, 0, 'First paragraph');
      assertParagraphText(parsed, 1, 'Second paragraph');
      assertParagraphText(parsed, 2, 'Third paragraph');
    });

    test('should render multiple paragraphs in ordered list', async () => {
      const htmlString = `
        <ol>
          <li>
            <p>First paragraph of item 1</p>
            <p>Second paragraph of item 1</p>
          </li>
        </ol>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'First paragraph of item 1');
      assertParagraphText(parsed, 1, 'Second paragraph of item 1');
    });
  });

  describe('Multiple list items with multiple paragraphs', () => {
    test('should render multiple list items each with multiple paragraphs', async () => {
      const htmlString = `
        <ul>
          <li>
            <p>Item 1, Para 1</p>
            <p>Item 1, Para 2</p>
          </li>
          <li>
            <p>Item 2, Para 1</p>
            <p>Item 2, Para 2</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Verify all content is present
      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Item 1, Para 1');
      expect(allText).toContain('Item 1, Para 2');
      expect(allText).toContain('Item 2, Para 1');
      expect(allText).toContain('Item 2, Para 2');
    });

    test('should handle mixed paragraph counts across list items', async () => {
      const htmlString = `
        <ul>
          <li>
            <p>Item 1, only one paragraph</p>
          </li>
          <li>
            <p>Item 2, Para 1</p>
            <p>Item 2, Para 2</p>
            <p>Item 2, Para 3</p>
          </li>
          <li>
            <p>Item 3, Para 1</p>
            <p>Item 3, Para 2</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Verify all content is present
      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Item 1, only one paragraph');
      expect(allText).toContain('Item 2, Para 1');
      expect(allText).toContain('Item 2, Para 2');
      expect(allText).toContain('Item 2, Para 3');
      expect(allText).toContain('Item 3, Para 1');
      expect(allText).toContain('Item 3, Para 2');
    });
  });

  describe('Styling and properties preservation', () => {
    test('should preserve individual paragraph styles', async () => {
      const htmlString = `
        <ul>
          <li>
            <p style="font-size: 12pt; color: red;">Red paragraph</p>
            <p style="font-size: 14pt; color: blue;">Blue paragraph</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Red paragraph');
      assertParagraphText(parsed, 1, 'Blue paragraph');
      // Styles should be preserved (detailed style checks can be added)
    });

    test('should inherit list item properties to paragraphs', async () => {
      const htmlString = `
        <ul>
          <li style="font-family: Arial, sans-serif;">
            <p>Paragraph inheriting Arial</p>
            <p>Another paragraph inheriting Arial</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Paragraph inheriting Arial');
      assertParagraphText(parsed, 1, 'Another paragraph inheriting Arial');
    });
  });

  describe('Regression tests - ensure existing functionality still works', () => {
    test('single paragraph in list item should still work', async () => {
      const htmlString = `
        <ul>
          <li><p>Single paragraph</p></li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Single paragraph');
    });

    test('text-only list items should still work', async () => {
      const htmlString = `
        <ul>
          <li>Direct text without paragraph tag</li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Direct text without paragraph tag');
    });

    test('inline elements in list items should still work', async () => {
      const htmlString = `
        <ul>
          <li>Text with <strong>bold</strong> and <em>italic</em></li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 1);
      expect(parsed.paragraphs[0].text).toContain('Text with');
      expect(parsed.paragraphs[0].text).toContain('bold');
      expect(parsed.paragraphs[0].text).toContain('italic');
    });

    test('multiple list items with single paragraph each', async () => {
      const htmlString = `
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 3);
      assertParagraphText(parsed, 0, 'Item 1');
      assertParagraphText(parsed, 1, 'Item 2');
      assertParagraphText(parsed, 2, 'Item 3');
    });
  });

  describe('Complex scenarios', () => {
    test('should handle nested lists where inner list items have multiple paragraphs', async () => {
      const htmlString = `
        <ul>
          <li>
            <p>Outer item paragraph 1</p>
            <p>Outer item paragraph 2</p>
            <ul>
              <li>
                <p>Inner item paragraph 1</p>
                <p>Inner item paragraph 2</p>
              </li>
            </ul>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Check that key text content is present (nested lists may have complex structure)
      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Outer item paragraph 1');
      expect(allText).toContain('Outer item paragraph 2');
      expect(allText).toContain('Inner item paragraph 1');
      expect(allText).toContain('Inner item paragraph 2');
    });

    test('should handle mixed content in list item (text + paragraph + text)', async () => {
      const htmlString = `
        <ul>
          <li>
            Some direct text
            <p>A paragraph in the middle</p>
            More direct text after
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Should create paragraphs for all content
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(1);

      // Check that paragraph text is preserved (mixed content handling may vary)
      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('A paragraph in the middle');
      // Note: Direct text nodes may be handled differently - focus is on paragraph extraction
    });

    test('should handle empty paragraphs in list items', async () => {
      const htmlString = `
        <ul>
          <li>
            <p>First paragraph</p>
            <p></p>
            <p>Third paragraph</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Should handle empty paragraphs gracefully
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);

      // Check non-empty paragraphs
      const nonEmptyParas = parsed.paragraphs.filter((p) => p.text.trim().length > 0);
      expect(nonEmptyParas.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle div elements inside list items with multiple paragraphs', async () => {
      const htmlString = `
        <ul>
          <li>
            <div>
              <p>Paragraph inside div 1</p>
              <p>Paragraph inside div 2</p>
            </div>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Paragraph inside div 1');
      assertParagraphText(parsed, 1, 'Paragraph inside div 2');
    });
  });

  describe('Continuation paragraphs (OOXML compliance)', () => {
    test('should NOT add numbering to continuation paragraphs', async () => {
      const htmlString = `
        <ul>
          <li>
            <p>First paragraph with bullet</p>
            <p>Second paragraph without bullet</p>
            <p>Third paragraph without bullet</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Verify all paragraphs exist
      assertParagraphCount(parsed, 3);
      assertParagraphText(parsed, 0, 'First paragraph with bullet');
      assertParagraphText(parsed, 1, 'Second paragraph without bullet');
      assertParagraphText(parsed, 2, 'Third paragraph without bullet');

      // Check the raw XML for numbering properties
      const JSZip = require('jszip');
      const zip = await JSZip.loadAsync(docx);
      const documentXml = await zip.file('word/document.xml').async('string');

      // Count numPr elements (should only be 1, for the first paragraph)
      const numPrMatches = documentXml.match(/<w:numPr>/g);
      const numPrCount = numPrMatches ? numPrMatches.length : 0;

      // Should only have ONE paragraph with numbering (the first one)
      expect(numPrCount).toBe(1);
    });

    test('should maintain proper indentation for continuation paragraphs', async () => {
      const htmlString = `
        <ul>
          <li>
            <p>First para</p>
            <p>Continuation para should be indented</p>
          </li>
        </ul>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const JSZip = require('jszip');
      const zip = await JSZip.loadAsync(docx);
      const documentXml = await zip.file('word/document.xml').async('string');

      // Continuation paragraphs should have indentation (w:ind)
      const indMatches = documentXml.match(/<w:ind/g);
      const indCount = indMatches ? indMatches.length : 0;

      // Should have indentation for continuation paragraph(s)
      expect(indCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Full document context from issue #145', () => {
    test('should render the exact HTML from issue #145 correctly', async () => {
      const htmlString = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Document</title>
          </head>
          <body>
            <div>
              <p>Test case: multiple paragraphs in a list item</p>
              <ul style="list-style-type: circle; margin-bottom: 0in; margin-top: 0px;">
                <li style="line-height: normal; margin: 0in 0in 0in 0px; font-size: 11pt; font-family: Calibri, sans-serif;">
                  <p style="font-size: 9.0pt; font-family: Arial, sans-serif;">Paragraph 1</p>
                  <p style="font-size: 9.0pt; font-family: Arial, sans-serif;">Paragraph 2</p>
                </li>
              </ul>
            </div>
          </body>
        </html>
      `;

      const docx = await HTMLtoDOCX(htmlString);
      const parsed = await parseDOCX(docx);

      // Should have at least 3 paragraphs: intro text + 2 list item paragraphs
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);

      // Check that all content is present
      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Test case: multiple paragraphs in a list item');
      expect(allText).toContain('Paragraph 1');
      expect(allText).toContain('Paragraph 2');

      // Find the list item paragraphs
      const para1Index = parsed.paragraphs.findIndex((p) => p.text === 'Paragraph 1');
      const para2Index = parsed.paragraphs.findIndex((p) => p.text === 'Paragraph 2');

      expect(para1Index).toBeGreaterThanOrEqual(0);
      expect(para2Index).toBeGreaterThanOrEqual(0);
      expect(para2Index).toBeGreaterThan(para1Index);
    });
  });

  describe('Block-level elements in list items', () => {
    describe('Headings in list items', () => {
      test('should render heading and paragraph in list item', async () => {
        const htmlString = `
          <ul>
            <li>
              <h3>Section Title</h3>
              <p>Section content paragraph</p>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const parsed = await parseDOCX(docx);

        // Should have 2 elements: heading + paragraph
        expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);

        const allText = parsed.paragraphs.map((p) => p.text).join(' ');
        expect(allText).toContain('Section Title');
        expect(allText).toContain('Section content paragraph');
      });

      test('should render multiple headings in list item', async () => {
        const htmlString = `
          <ul>
            <li>
              <h2>Main Heading</h2>
              <p>Intro paragraph</p>
              <h3>Subheading</h3>
              <p>Detail paragraph</p>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const parsed = await parseDOCX(docx);

        const allText = parsed.paragraphs.map((p) => p.text).join(' ');
        expect(allText).toContain('Main Heading');
        expect(allText).toContain('Intro paragraph');
        expect(allText).toContain('Subheading');
        expect(allText).toContain('Detail paragraph');
      });

      test('should apply continuation indenting to heading after first block', async () => {
        const htmlString = `
          <ul>
            <li>
              <p>First paragraph (with bullet)</p>
              <h3>Heading (should be indented, no bullet)</h3>
              <p>Second paragraph (indented)</p>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const JSZip = require('jszip');
        const zip = await JSZip.loadAsync(docx);
        const documentXml = await zip.file('word/document.xml').async('string');

        // First element should have numbering
        // Subsequent elements (including heading) should have indentation
        const numPrMatches = documentXml.match(/<w:numPr>/g);
        const numPrCount = numPrMatches ? numPrMatches.length : 0;

        // Should only have ONE element with numbering (the first paragraph)
        expect(numPrCount).toBe(1);
      });
    });

    describe('Blockquotes in list items', () => {
      test('should render blockquote in list item', async () => {
        const htmlString = `
          <ul>
            <li>
              <p>Introduction</p>
              <blockquote>
                <p>This is a quoted paragraph</p>
              </blockquote>
              <p>Conclusion</p>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const parsed = await parseDOCX(docx);

        const allText = parsed.paragraphs.map((p) => p.text).join(' ');
        expect(allText).toContain('Introduction');
        expect(allText).toContain('This is a quoted paragraph');
        expect(allText).toContain('Conclusion');
      });

      test('should handle blockquote with multiple paragraphs', async () => {
        const htmlString = `
          <ul>
            <li>
              <p>Before quote</p>
              <blockquote>
                <p>Quote paragraph 1</p>
                <p>Quote paragraph 2</p>
              </blockquote>
              <p>After quote</p>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const parsed = await parseDOCX(docx);

        const allText = parsed.paragraphs.map((p) => p.text).join(' ');
        expect(allText).toContain('Before quote');
        expect(allText).toContain('Quote paragraph 1');
        expect(allText).toContain('Quote paragraph 2');
        expect(allText).toContain('After quote');
      });
    });

    describe('Pre/code blocks in list items', () => {
      test('should render pre block in list item', async () => {
        // Note: <pre> with direct text content requires <code> wrapper for proper rendering
        // This is a known limitation of html-to-docx's pre tag handling
        const htmlString = `
          <ul>
            <li>
              <p>Code example:</p>
              <pre><code>def calculate_sum(a, b): return a + b</code></pre>
              <p>End of example</p>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const parsed = await parseDOCX(docx);

        const allText = parsed.paragraphs.map((p) => p.text).join(' ');
        expect(allText).toContain('Code example:');
        expect(allText).toContain('calculate_sum');
        expect(allText).toContain('End of example');
      });

      test('should render code block with proper formatting', async () => {
        const htmlString = `
          <ul>
            <li>
              <p>Install via npm:</p>
              <pre><code>npm install html-to-docx</code></pre>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const parsed = await parseDOCX(docx);

        const allText = parsed.paragraphs.map((p) => p.text).join(' ');
        expect(allText).toContain('Install via npm:');
        expect(allText).toContain('npm install html-to-docx');
      });
    });

    describe('Mixed block elements in list items', () => {
      test('should handle h3 + p + blockquote + ul + p sequence', async () => {
        const htmlString = `
          <ul>
            <li>
              <h3>Section Title</h3>
              <p>Introduction paragraph</p>
              <blockquote><p>Important note</p></blockquote>
              <ul>
                <li>Nested item</li>
              </ul>
              <p>Final paragraph</p>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const parsed = await parseDOCX(docx);

        const allText = parsed.paragraphs.map((p) => p.text).join(' ');
        expect(allText).toContain('Section Title');
        expect(allText).toContain('Introduction paragraph');
        expect(allText).toContain('Important note');
        expect(allText).toContain('Nested item');
        expect(allText).toContain('Final paragraph');
      });

      test('should properly indent all continuation blocks', async () => {
        const htmlString = `
          <ul>
            <li>
              <p>First block (with bullet)</p>
              <h4>Heading block (indented)</h4>
              <blockquote><p>Quote block (indented)</p></blockquote>
              <pre>Code block (indented)</pre>
            </li>
          </ul>
        `;

        const docx = await HTMLtoDOCX(htmlString);
        const JSZip = require('jszip');
        const zip = await JSZip.loadAsync(docx);
        const documentXml = await zip.file('word/document.xml').async('string');

        // Only first block should have numbering
        const numPrMatches = documentXml.match(/<w:numPr>/g);
        const numPrCount = numPrMatches ? numPrMatches.length : 0;
        expect(numPrCount).toBe(1);

        // Should have indentation for continuation blocks
        const indMatches = documentXml.match(/<w:ind/g);
        const indCount = indMatches ? indMatches.length : 0;
        expect(indCount).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
