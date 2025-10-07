/**
 * DOCX Assertion Helpers
 * Semantic assertion functions for validating DOCX content in tests
 *
 * Usage pattern:
 *   const parsed = await parseDOCX(docxBuffer);
 *   assertParagraphCount(parsed, 2);
 *   assertParagraphText(parsed, 0, 'Hello');
 */

import { parseDOCX } from './docx-validator.js';

// Re-export parseDOCX for convenience
export { parseDOCX };

/**
 * Assert that a parsed DOCX has the expected number of paragraphs
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} expectedCount - Expected number of paragraphs
 */
export function assertParagraphCount(parsed, expectedCount) {
  expect(parsed.paragraphs.length).toBe(expectedCount);
}

/**
 * Assert that a specific paragraph contains expected text
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedText - Expected text content
 */
export function assertParagraphText(parsed, paragraphIndex, expectedText) {
  if (paragraphIndex >= parsed.paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${parsed.paragraphs.length} paragraphs.`
    );
  }

  const actualText = parsed.paragraphs[paragraphIndex].text;
  expect(actualText).toBe(expectedText);
}

/**
 * Assert that a specific paragraph has expected alignment
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedAlignment - Expected alignment (left, center, right, both)
 */
export function assertParagraphAlignment(parsed, paragraphIndex, expectedAlignment) {
  if (paragraphIndex >= parsed.paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${parsed.paragraphs.length} paragraphs.`
    );
  }

  const actualAlignment = parsed.paragraphs[paragraphIndex].properties.alignment;
  expect(actualAlignment).toBe(expectedAlignment);
}

/**
 * Assert that all paragraphs have a specific property
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {string} propertyName - Property name to check (alignment, spacingBefore, etc.)
 * @param {any} expectedValue - Expected property value
 */
export function assertAllParagraphsHaveProperty(parsed, propertyName, expectedValue) {
  parsed.paragraphs.forEach((para, index) => {
    const actualValue = para.properties[propertyName];
    expect(actualValue).toBe(expectedValue);
  });
}

/**
 * Assert that a paragraph's first run has expected text color
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedColor - Expected color in hex (e.g., 'FF0000' for red)
 */
export function assertRunColor(parsed, paragraphIndex, expectedColor) {
  if (paragraphIndex >= parsed.paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${parsed.paragraphs.length} paragraphs.`
    );
  }

  const runs = parsed.paragraphs[paragraphIndex].runs;
  if (runs.length === 0) {
    throw new Error(`Paragraph ${paragraphIndex} has no text runs`);
  }

  const actualColor = runs[0].color;
  expect(actualColor).toBe(expectedColor);
}

/**
 * Assert that a paragraph's first run has expected font family
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedFont - Expected font name
 */
export function assertRunFont(parsed, paragraphIndex, expectedFont) {
  if (paragraphIndex >= parsed.paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${parsed.paragraphs.length} paragraphs.`
    );
  }

  const runs = parsed.paragraphs[paragraphIndex].runs;
  if (runs.length === 0) {
    throw new Error(`Paragraph ${paragraphIndex} has no text runs`);
  }

  const actualFont = runs[0].font;
  expect(actualFont).toBe(expectedFont);
}

/**
 * Assert that a paragraph has a specific property value
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} propertyName - Property name
 * @param {any} expectedValue - Expected value
 */
export function assertParagraphProperty(parsed, paragraphIndex, propertyName, expectedValue) {
  if (paragraphIndex >= parsed.paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${parsed.paragraphs.length} paragraphs.`
    );
  }

  const actualValue = parsed.paragraphs[paragraphIndex].properties[propertyName];
  expect(actualValue).toBe(expectedValue);
}
