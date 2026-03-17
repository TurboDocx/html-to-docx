/**
 * Page Break Integration Tests
 * Tests for page-break-before and page-break-after CSS properties
 *
 * Related issue: https://github.com/TurboDocx/html-to-docx/issues/175
 */

import HTMLtoDOCX from '../index.js';
import {
  parseDOCX,
  assertParagraphCount,
  assertParagraphText,
  assertParagraphHasPageBreakBefore,
  assertParagraphNoPageBreakBefore,
  assertParagraphHasPageBreakRun,
} from './helpers/docx-assertions.js';
import { PAGE_BREAK_BEFORE_REGEX, PAGE_BREAK_RUN_REGEX, PAGE_BREAK_RUN_IN_R_REGEX } from './helpers/constants.js';

describe('Page Break Support', () => {
  describe('page-break-before: always', () => {
    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should add pageBreakBefore on a <p> element', async () => {
      const htmlString = '<p>First paragraph</p><p style="page-break-before: always;">Second paragraph</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'First paragraph');
      assertParagraphNoPageBreakBefore(parsed, 0);
      assertParagraphText(parsed, 1, 'Second paragraph');
      assertParagraphHasPageBreakBefore(parsed, 1);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should add pageBreakBefore on heading elements', async () => {
      const htmlString = '<p>Intro</p><h1 style="page-break-before: always;">Chapter 2</h1>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 1, 'Chapter 2');
      assertParagraphHasPageBreakBefore(parsed, 1);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should add pageBreakBefore on a <blockquote> element', async () => {
      const htmlString = '<blockquote style="page-break-before: always;">Quote text</blockquote>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Quote text');
      assertParagraphHasPageBreakBefore(parsed, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should add pageBreakBefore on a <pre> element', async () => {
      const htmlString = '<pre style="page-break-before: always;">Code text</pre>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Code text');
      assertParagraphHasPageBreakBefore(parsed, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should add pageBreakBefore on a <div> element', async () => {
      const htmlString = '<p>Before</p><div style="page-break-before: always;"><p>After break</p></div>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // paragraph "Before", empty paragraph with pageBreakBefore, paragraph "After break"
      assertParagraphCount(parsed, 3);
      assertParagraphText(parsed, 0, 'Before');
      // The second paragraph should have pageBreakBefore (the empty one inserted by div handling)
      assertParagraphHasPageBreakBefore(parsed, 1);
      // Child content should be preserved
      expect(parsed.xml).toContain('After break');
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should place pageBreakBefore inside w:pPr', async () => {
      const htmlString = '<p style="page-break-before: always;">Content</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // Verify the XML structure: pageBreakBefore should be inside pPr
      const paraXml = parsed.paragraphs[0].xml;
      const pPrMatch = paraXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
      expect(pPrMatch).not.toBeNull();
      expect(pPrMatch[1]).toMatch(PAGE_BREAK_BEFORE_REGEX);
    });
  });

  describe('page-break-after: always', () => {
    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should add page break run after a <p> element', async () => {
      const htmlString = '<p style="page-break-after: always;">First paragraph</p><p>Second paragraph</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'First paragraph');
      // The first paragraph should contain a break run
      assertParagraphHasPageBreakRun(parsed, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should add page break run after a heading', async () => {
      const htmlString = '<h2 style="page-break-after: always;">Section End</h2><p>Next section</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Section End');
      assertParagraphHasPageBreakRun(parsed, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should produce w:br with type page inside w:r', async () => {
      const htmlString = '<p style="page-break-after: always;">Content</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      const paraXml = parsed.paragraphs[0].xml;
      expect(paraXml).toMatch(PAGE_BREAK_RUN_REGEX);
      // Verify it's inside a run
      expect(paraXml).toMatch(PAGE_BREAK_RUN_IN_R_REGEX);
    });
  });

  describe('page-break-after on <div>', () => {
    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should preserve children of div with page-break-after', async () => {
      const htmlString = '<div style="page-break-after: always;"><p>Child content</p></div><p>After</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // Child content should NOT be discarded
      expect(parsed.xml).toContain('Child content');
      expect(parsed.xml).toContain('After');
      // Should have a page break run in the XML
      expect(parsed.xml).toMatch(PAGE_BREAK_RUN_REGEX);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should preserve children of div with page-break-before', async () => {
      const htmlString = '<p>Before</p><div style="page-break-before: always;"><p>Child content</p></div>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      expect(parsed.xml).toContain('Before');
      expect(parsed.xml).toContain('Child content');
      expect(parsed.xml).toMatch(PAGE_BREAK_BEFORE_REGEX);
    });
  });

  describe('Backward compatibility', () => {
    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should support legacy <div class="page-break"> pattern', async () => {
      const htmlString = '<p>Before</p><div class="page-break"></div><p>After</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphText(parsed, 0, 'Before');
      // The page-break div generates a paragraph with a break run
      assertParagraphHasPageBreakRun(parsed, 1);
      assertParagraphText(parsed, 2, 'After');
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should prioritize class="page-break" over style when both are present', async () => {
      // When class="page-break" is present, the legacy path fires (early return).
      // The style attribute is never evaluated — this test verifies that behavior.
      const htmlString = '<p>Before</p><div class="page-break" style="page-break-after: always;"></div><p>After</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphText(parsed, 0, 'Before');
      assertParagraphHasPageBreakRun(parsed, 1);
      assertParagraphText(parsed, 2, 'After');
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should handle page-break-after style on div without class="page-break"', async () => {
      const htmlString = '<p>Before</p><div style="page-break-after: always;"><p>Div content</p></div><p>After</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // Style-based path: children are preserved, break appended after
      expect(parsed.xml).toContain('Div content');
      expect(parsed.xml).toContain('After');
      expect(parsed.xml).toMatch(PAGE_BREAK_RUN_REGEX);
    });
  });

  describe('Value validation', () => {
    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should NOT trigger break for page-break-before: auto', async () => {
      const htmlString = '<p style="page-break-before: auto;">No break</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'No break');
      assertParagraphNoPageBreakBefore(parsed, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should NOT trigger break for page-break-before: avoid', async () => {
      const htmlString = '<p style="page-break-before: avoid;">No break</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphNoPageBreakBefore(parsed, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should trigger break for page-break-after: auto (backward compat)', async () => {
      const htmlString = '<p style="page-break-after: auto;">Break</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphHasPageBreakRun(parsed, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should trigger break for page-break-after: avoid (backward compat)', async () => {
      const htmlString = '<p style="page-break-after: avoid;">Break</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphHasPageBreakRun(parsed, 0);
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should trigger break for any truthy page-break-after value (backward compat)', async () => {
      const htmlString = '<p style="page-break-after: left;">Break</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphHasPageBreakRun(parsed, 0);
    });
  });

  describe('Combined page-break-before and page-break-after', () => {
    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should handle both page-break-before and page-break-after on same element', async () => {
      const htmlString = '<p>Before</p><p style="page-break-before: always; page-break-after: always;">Middle</p><p>After</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphText(parsed, 0, 'Before');
      // The middle paragraph should have both
      const middlePara = parsed.paragraphs[1];
      expect(middlePara.xml).toMatch(PAGE_BREAK_BEFORE_REGEX);
      expect(middlePara.xml).toMatch(PAGE_BREAK_RUN_REGEX);
      expect(middlePara.text).toBe('Middle');
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should handle both breaks on a <div>', async () => {
      const htmlString = '<p>Before</p><div style="page-break-before: always; page-break-after: always;"><p>Content</p></div><p>After</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      expect(parsed.xml).toContain('Before');
      expect(parsed.xml).toContain('Content');
      expect(parsed.xml).toContain('After');
      expect(parsed.xml).toMatch(PAGE_BREAK_BEFORE_REGEX);
      expect(parsed.xml).toMatch(PAGE_BREAK_RUN_REGEX);
    });
  });

  describe('XML structure verification', () => {
    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should generate correct XML for page-break-before', async () => {
      const htmlString = '<p style="page-break-before: always;">Content</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // Verify the raw XML contains pageBreakBefore
      expect(parsed.xml).toContain('w:pageBreakBefore');
    });

    // https://github.com/TurboDocx/html-to-docx/issues/175
    test('should generate correct XML for page-break-after', async () => {
      const htmlString = '<p style="page-break-after: always;">Content</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // Verify the raw XML contains a page break run
      expect(parsed.xml).toMatch(/<w:r>\s*<w:br[^>]*w:type="page"[^>]*\/>\s*<\/w:r>/);
    });
  });
});
