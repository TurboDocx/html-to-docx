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

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Validate paragraph index and return the paragraph.
 *
 * @param {Object} parsed - Parsed DOCX object
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} functionName - Name of calling function (for error messages)
 * @returns {Object} The validated paragraph object
 * @throws {Error} If index is out of range
 */
function validateParagraphIndex(parsed, paragraphIndex, functionName) {
  if (paragraphIndex >= parsed.paragraphs.length) {
    throw new Error(
      `${functionName}: Paragraph index ${paragraphIndex} out of range. Document has ${parsed.paragraphs.length} paragraphs.`
    );
  }
  return parsed.paragraphs[paragraphIndex];
}

// =============================================================================
// PUBLIC ASSERTION FUNCTIONS
// =============================================================================

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
  // Use shared validation helper instead of duplicating bounds check
  const para = validateParagraphIndex(parsed, paragraphIndex, 'assertParagraphText');
  expect(para.text).toBe(expectedText);
}

/**
 * Assert that a specific paragraph has expected alignment
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedAlignment - Expected alignment (left, center, right, both)
 */
export function assertParagraphAlignment(parsed, paragraphIndex, expectedAlignment) {
  const para = validateParagraphIndex(parsed, paragraphIndex, 'assertParagraphAlignment');
  expect(para.properties.alignment).toBe(expectedAlignment);
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
  const para = validateParagraphIndex(parsed, paragraphIndex, 'assertRunColor');

  if (para.runs.length === 0) {
    throw new Error(`assertRunColor: Paragraph ${paragraphIndex} has no text runs`);
  }

  expect(para.runs[0].color).toBe(expectedColor);
}

/**
 * Assert that a paragraph's first run has expected font family
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedFont - Expected font name
 */
export function assertRunFont(parsed, paragraphIndex, expectedFont) {
  const para = validateParagraphIndex(parsed, paragraphIndex, 'assertRunFont');

  if (para.runs.length === 0) {
    throw new Error(`assertRunFont: Paragraph ${paragraphIndex} has no text runs`);
  }

  expect(para.runs[0].font).toBe(expectedFont);
}

/**
 * Assert that a paragraph has a specific property value
 * @param {Object} parsed - Parsed DOCX object from parseDOCX()
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} propertyName - Property name
 * @param {any} expectedValue - Expected value
 */
export function assertParagraphProperty(parsed, paragraphIndex, propertyName, expectedValue) {
  const para = validateParagraphIndex(parsed, paragraphIndex, 'assertParagraphProperty');
  expect(para.properties[propertyName]).toBe(expectedValue);
}
