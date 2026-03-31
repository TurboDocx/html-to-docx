/**
 * Strikethrough Integration Tests
 * Tests for strikethrough/strike-through text formatting using <del>, <s>, and <strike> tags
 *
 * Related PR: https://github.com/TurboDocx/html-to-docx/pull/157
 */

import HTMLtoDOCX from '../index.js';
import {
  parseDOCX,
  assertParagraphCount,
  assertParagraphText,
  assertRunHasStrike,
  assertRunNoStrike,
} from './helpers/docx-assertions.js';

describe('Strikethrough Formatting', () => {
  describe('Basic strikethrough tags', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should apply strikethrough formatting with <del> tag', async () => {
      const htmlString = '<p><del>deleted text</del></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'deleted text');
      assertRunHasStrike(parsed, 0, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should apply strikethrough formatting with <s> tag', async () => {
      const htmlString = '<p><s>strikethrough text</s></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'strikethrough text');
      assertRunHasStrike(parsed, 0, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should apply strikethrough formatting with <strike> tag', async () => {
      const htmlString = '<p><strike>strike text</strike></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'strike text');
      assertRunHasStrike(parsed, 0, 0);
    });
  });

  describe('Mixed content with strikethrough', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough text mixed with regular text', async () => {
      const htmlString = '<p>This is a <del>strikethrough</del> test.</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'This is a strikethrough test.');

      // First run should NOT have strikethrough (regular text)
      assertRunNoStrike(parsed, 0, 0);
      // Second run should have strikethrough
      assertRunHasStrike(parsed, 0, 1);
      // Third run should NOT have strikethrough (regular text)
      assertRunNoStrike(parsed, 0, 2);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle <s> tag mixed with regular text', async () => {
      const htmlString = '<p>This is a <s>strikethrough</s> test.</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'This is a strikethrough test.');
      assertRunHasStrike(parsed, 0, 1);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle <strike> tag mixed with regular text', async () => {
      const htmlString = '<p>This is a <strike>strikethrough</strike> test.</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'This is a strikethrough test.');
      assertRunHasStrike(parsed, 0, 1);
    });
  });

  describe('Strikethrough combined with other formatting', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough with bold formatting', async () => {
      const htmlString = '<p><b><del>bold strikethrough</del></b></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'bold strikethrough');
      assertRunHasStrike(parsed, 0, 0);
      expect(parsed.paragraphs[0].runs[0].bold).toBe(true);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough with italic formatting', async () => {
      const htmlString = '<p><em><del>italic strikethrough</del></em></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'italic strikethrough');
      assertRunHasStrike(parsed, 0, 0);
      expect(parsed.paragraphs[0].runs[0].italic).toBe(true);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough with bold and italic formatting', async () => {
      const htmlString = '<p><b><em><del>bold italic strikethrough</del></em></b></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'bold italic strikethrough');
      assertRunHasStrike(parsed, 0, 0);
      expect(parsed.paragraphs[0].runs[0].bold).toBe(true);
      expect(parsed.paragraphs[0].runs[0].italic).toBe(true);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle nested formatting - bold inside del', async () => {
      const htmlString = '<p><del><b>bold inside del</b></del></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'bold inside del');
      assertRunHasStrike(parsed, 0, 0);
      expect(parsed.paragraphs[0].runs[0].bold).toBe(true);
    });
  });

  describe('Multiple strikethrough elements', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle multiple strikethrough elements in same paragraph', async () => {
      const htmlString = '<p><del>first</del> and <del>second</del></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'first and second');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough in multiple paragraphs', async () => {
      const htmlString = `
        <p><del>First strikethrough</del></p>
        <p><s>Second strikethrough</s></p>
        <p><strike>Third strikethrough</strike></p>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 3);
      assertParagraphText(parsed, 0, 'First strikethrough');
      assertParagraphText(parsed, 1, 'Second strikethrough');
      assertParagraphText(parsed, 2, 'Third strikethrough');
      assertRunHasStrike(parsed, 0, 0);
      assertRunHasStrike(parsed, 1, 0);
      assertRunHasStrike(parsed, 2, 0);
    });
  });

  describe('Edge cases', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle empty strikethrough tag', async () => {
      const htmlString = '<p>Before<del></del>After</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      // Empty del tag should not affect surrounding text
      expect(parsed.paragraphs[0].text).toContain('Before');
      expect(parsed.paragraphs[0].text).toContain('After');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough with whitespace', async () => {
      const htmlString = '<p><del>   spaced text   </del></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      expect(parsed.paragraphs[0].text).toContain('spaced text');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough with special characters', async () => {
      const htmlString = '<p><del>&amp; &lt; &gt; "quotes"</del></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, '& < > "quotes"');
      assertRunHasStrike(parsed, 0, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle deeply nested strikethrough', async () => {
      const htmlString = '<p><span><span><del>deeply nested</del></span></span></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'deeply nested');
    });
  });

  describe('Strikethrough in complex structures', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough in list items', async () => {
      const htmlString = `
        <ul>
          <li><del>deleted item</del></li>
          <li>normal item</li>
        </ul>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // List items are converted to paragraphs
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough in table cells', async () => {
      const htmlString = `
        <table>
          <tr>
            <td><del>deleted cell</del></td>
            <td>normal cell</td>
          </tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // Table content should be present
      expect(parsed.xml).toContain('deleted cell');
      expect(parsed.xml).toContain('normal cell');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle strikethrough in headings', async () => {
      const htmlString = '<h1><del>Deleted Heading</del></h1>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Deleted Heading');
    });
  });

  describe('All three strikethrough tag variants', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should produce equivalent output for del, s, and strike tags', async () => {
      const htmlDel = '<p><del>text</del></p>';
      const htmlS = '<p><s>text</s></p>';
      const htmlStrike = '<p><strike>text</strike></p>';

      const resultDel = await HTMLtoDOCX(htmlDel, {});
      const resultS = await HTMLtoDOCX(htmlS, {});
      const resultStrike = await HTMLtoDOCX(htmlStrike, {});

      const parsedDel = await parseDOCX(resultDel);
      const parsedS = await parseDOCX(resultS);
      const parsedStrike = await parseDOCX(resultStrike);

      // All three should have the same text
      assertParagraphText(parsedDel, 0, 'text');
      assertParagraphText(parsedS, 0, 'text');
      assertParagraphText(parsedStrike, 0, 'text');

      // All three should have strikethrough formatting
      assertRunHasStrike(parsedDel, 0, 0);
      assertRunHasStrike(parsedS, 0, 0);
      assertRunHasStrike(parsedStrike, 0, 0);
    });
  });

  describe('XML output verification', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should generate correct w:strike element in XML', async () => {
      const htmlString = '<p><del>strikethrough</del></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // Verify the raw XML contains the strike element
      expect(parsed.xml).toContain('w:strike');
    });
  });

  describe('CSS text-decoration: line-through', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should apply strikethrough via inline style text-decoration: line-through', async () => {
      const htmlString = '<p><span style="text-decoration: line-through;">strikethrough via CSS</span></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'strikethrough via CSS');
      assertRunHasStrike(parsed, 0, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle CSS strikethrough mixed with regular text', async () => {
      const htmlString = '<p>This is a <span style="text-decoration: line-through;">strikethrough</span> test.</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'This is a strikethrough test.');
      // The strikethrough run should have strike formatting
      assertRunHasStrike(parsed, 0, 1);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle CSS strikethrough on paragraph level', async () => {
      const htmlString = '<p style="text-decoration: line-through;">entire paragraph strikethrough</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'entire paragraph strikethrough');
      // Verify strike is in the XML
      expect(parsed.xml).toContain('w:strike');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should produce equivalent output for CSS and HTML tag strikethrough', async () => {
      const htmlTag = '<p><del>text</del></p>';
      const htmlCSS = '<p><span style="text-decoration: line-through;">text</span></p>';

      const resultTag = await HTMLtoDOCX(htmlTag, {});
      const resultCSS = await HTMLtoDOCX(htmlCSS, {});

      const parsedTag = await parseDOCX(resultTag);
      const parsedCSS = await parseDOCX(resultCSS);

      // Both should have the same text
      assertParagraphText(parsedTag, 0, 'text');
      assertParagraphText(parsedCSS, 0, 'text');

      // Both should have strikethrough formatting
      assertRunHasStrike(parsedTag, 0, 0);
      assertRunHasStrike(parsedCSS, 0, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/157
    test('should handle combined underline and line-through', async () => {
      const htmlString = '<p><span style="text-decoration: underline line-through;">underline and strikethrough</span></p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'underline and strikethrough');
      // Verify both underline and strike are in the XML
      expect(parsed.xml).toContain('w:strike');
      expect(parsed.xml).toContain('w:u');
    });
  });
});
