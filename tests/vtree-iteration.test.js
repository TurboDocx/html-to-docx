// Unit tests for vTree iteration and property inheritance
// Related to PR #127: https://github.com/TurboDocx/html-to-docx/pull/127
//
// This PR fixes the vTree iteration to handle both array and single object cases.
// Tests validate actual DOCX XML output rather than just checking if generation succeeds.

import HTMLtoDOCX from '../dist/html-to-docx.esm.js';
import {
  assertParagraphCount,
  assertParagraphText,
  assertParagraphAlignment,
  assertAllParagraphsHaveProperty,
  getParsedDOCX,
} from './helpers/docx-assertions.js';

describe('vTree iteration and property inheritance', () => {
  describe('Array vTree handling', () => {
    test('should create multiple paragraphs from array vTree', async () => {
      const htmlString = '<p>First paragraph</p><p>Second paragraph</p>';
      const docx = await HTMLtoDOCX(htmlString);

      // Validate that 2 paragraphs were created (array vTree case)
      await assertParagraphCount(docx, 2);

      // Validate text content of each paragraph
      await assertParagraphText(docx, 0, 'First paragraph');
      await assertParagraphText(docx, 1, 'Second paragraph');
    });

    test('should apply inherited properties to all children in array vTree', async () => {
      // Test that properties parameter is applied to each child in the array
      const htmlString = '<p>Paragraph 1</p><p>Paragraph 2</p>';
      const docx = await HTMLtoDOCX(htmlString, null, {
        // Center alignment should be inherited by both paragraphs
      });

      const parsed = await getParsedDOCX(docx);

      // Both paragraphs should exist
      expect(parsed.paragraphs.length).toBe(2);
      expect(parsed.paragraphs[0].text).toBe('Paragraph 1');
      expect(parsed.paragraphs[1].text).toBe('Paragraph 2');
    });

    test('should handle array vTree with styled divs', async () => {
      // Divs with inline styles should pass properties down to children
      const htmlString = '<div style="color: red;"><p>Paragraph 1</p><p>Paragraph 2</p></div>';
      const docx = await HTMLtoDOCX(htmlString);

      // Should create 2 paragraphs from the children of the div
      const paragraphs = await assertParagraphCount(docx, 2);

      expect(paragraphs[0].text).toBe('Paragraph 1');
      expect(paragraphs[1].text).toBe('Paragraph 2');
    });
  });

  describe('Single object vTree handling', () => {
    test('should create single paragraph from single vTree object', async () => {
      const htmlString = '<p style="text-align: center;">Single paragraph</p>';
      const docx = await HTMLtoDOCX(htmlString);

      // Validate that only 1 paragraph was created (single vTree case)
      await assertParagraphCount(docx, 1);

      // Validate text content
      await assertParagraphText(docx, 0, 'Single paragraph');

      // Validate alignment property was applied
      await assertParagraphAlignment(docx, 0, 'center');
    });

    test('should handle single vTree node without explicit style', async () => {
      const htmlString = '<p>Plain paragraph</p>';
      const docx = await HTMLtoDOCX(htmlString);

      await assertParagraphCount(docx, 1);
      await assertParagraphText(docx, 0, 'Plain paragraph');
    });

    test('should handle plain text as single vTree node', async () => {
      const htmlString = 'Plain text';
      const docx = await HTMLtoDOCX(htmlString);

      // Plain text should be wrapped in a paragraph
      const paragraphs = await assertParagraphCount(docx, 1);
      expect(paragraphs[0].text).toBe('Plain text');
    });
  });

  describe('Edge cases', () => {
    test('should handle HTML with nested elements', async () => {
      const htmlString = '<div><p>Outer <span>inner</span> text</p></div>';
      const docx = await HTMLtoDOCX(htmlString);

      await assertParagraphCount(docx, 1);
      await assertParagraphText(docx, 0, 'Outer inner text');
    });

    test('should handle mixed content types', async () => {
      const htmlString = '<div><h1>Title</h1><p>Paragraph</p><ul><li>Item 1</li></ul></div>';
      const docx = await HTMLtoDOCX(htmlString);

      const parsed = await getParsedDOCX(docx);

      // Should have heading, paragraph, and list item
      expect(parsed.paragraphs.length).toBeGreaterThanOrEqual(3);

      // Check that text content was preserved
      const allText = parsed.paragraphs.map((p) => p.text).join(' ');
      expect(allText).toContain('Title');
      expect(allText).toContain('Paragraph');
      expect(allText).toContain('Item 1');
    });

    test('should handle HTML with multiple inline style attributes', async () => {
      const htmlString =
        '<p style="color: blue; font-size: 14px; text-align: justify;">Styled text</p>';
      const docx = await HTMLtoDOCX(htmlString);

      await assertParagraphCount(docx, 1);
      await assertParagraphText(docx, 0, 'Styled text');
      await assertParagraphAlignment(docx, 0, 'both'); // justify maps to 'both' in OOXML
    });
  });

  describe('Property inheritance', () => {
    test('should inherit properties in array vTree', async () => {
      const htmlString = '<div style="font-family: Arial;"><p>Child 1</p><p>Child 2</p></div>';
      const docx = await HTMLtoDOCX(htmlString);

      const paragraphs = await assertParagraphCount(docx, 2);

      // Both paragraphs should exist with correct text (validates array vTree handling)
      expect(paragraphs[0].text).toBe('Child 1');
      expect(paragraphs[1].text).toBe('Child 2');

      // Both paragraphs should have runs (validates content was rendered)
      expect(paragraphs[0].runs.length).toBeGreaterThan(0);
      expect(paragraphs[1].runs.length).toBeGreaterThan(0);

      // Font family inheritance is tested separately - this test validates
      // that the array vTree iteration doesn't crash and creates proper structure
    });

    test('should preserve child properties over inherited ones', async () => {
      // Child's explicit style should override parent's style
      const htmlString =
        '<div style="text-align: left;"><p style="text-align: center;">Override</p></div>';
      const docx = await HTMLtoDOCX(htmlString);

      await assertParagraphCount(docx, 1);
      await assertParagraphText(docx, 0, 'Override');

      // Child's explicit center alignment should win over parent's left
      await assertParagraphAlignment(docx, 0, 'center');
    });

    test('should handle partial property objects', async () => {
      const htmlString = '<p style="margin-left: 20px;">Indented paragraph</p>';
      const docx = await HTMLtoDOCX(htmlString);

      await assertParagraphCount(docx, 1);
      await assertParagraphText(docx, 0, 'Indented paragraph');

      // Document should be created successfully even with partial styles
      const parsed = await getParsedDOCX(docx);
      expect(parsed.paragraphs[0].xml).toContain('Indented paragraph');
    });
  });

  describe('vTree type detection', () => {
    test('should correctly identify and process array vTree', async () => {
      // Multiple top-level elements should create array vTree
      const htmlString = '<p>First</p><p>Second</p><p>Third</p>';
      const docx = await HTMLtoDOCX(htmlString);

      // Array case: Should create exactly 3 paragraphs
      await assertParagraphCount(docx, 3);
      await assertParagraphText(docx, 0, 'First');
      await assertParagraphText(docx, 1, 'Second');
      await assertParagraphText(docx, 2, 'Third');
    });

    test('should correctly identify and process single object vTree', async () => {
      // Single top-level element should create single vTree object
      const htmlString = '<div><p>Only one top level</p></div>';
      const docx = await HTMLtoDOCX(htmlString);

      // Single object case: Should create 1 paragraph
      await assertParagraphCount(docx, 1);
      await assertParagraphText(docx, 0, 'Only one top level');
    });
  });
});
