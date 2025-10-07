/**
 * DOCX Assertion Helpers
 * Semantic assertion functions for validating DOCX content in tests
 */

import { parseDOCX } from './docx-validator.js';

/**
 * Assert that a DOCX has the expected number of paragraphs
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @param {number} expectedCount - Expected number of paragraphs
 */
export async function assertParagraphCount(docxBuffer, expectedCount) {
  const { paragraphs } = await parseDOCX(docxBuffer);
  expect(paragraphs.length).toBe(expectedCount);
  return paragraphs;
}

/**
 * Assert that a specific paragraph contains expected text
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedText - Expected text content
 */
export async function assertParagraphText(docxBuffer, paragraphIndex, expectedText) {
  const { paragraphs } = await parseDOCX(docxBuffer);

  if (paragraphIndex >= paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${paragraphs.length} paragraphs.`
    );
  }

  const actualText = paragraphs[paragraphIndex].text;
  expect(actualText).toBe(expectedText);
  return paragraphs[paragraphIndex];
}

/**
 * Assert that a specific paragraph has expected alignment
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedAlignment - Expected alignment (left, center, right, both)
 */
export async function assertParagraphAlignment(docxBuffer, paragraphIndex, expectedAlignment) {
  const { paragraphs } = await parseDOCX(docxBuffer);

  if (paragraphIndex >= paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${paragraphs.length} paragraphs.`
    );
  }

  const actualAlignment = paragraphs[paragraphIndex].properties.alignment;
  expect(actualAlignment).toBe(expectedAlignment);
  return paragraphs[paragraphIndex];
}

/**
 * Assert that all paragraphs have a specific property
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @param {string} propertyName - Property name to check (alignment, spacingBefore, etc.)
 * @param {any} expectedValue - Expected property value
 */
export async function assertAllParagraphsHaveProperty(docxBuffer, propertyName, expectedValue) {
  const { paragraphs } = await parseDOCX(docxBuffer);

  paragraphs.forEach((para, index) => {
    const actualValue = para.properties[propertyName];
    expect(actualValue).toBe(expectedValue);
  });

  return paragraphs;
}

/**
 * Assert that a paragraph's first run has expected text color
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedColor - Expected color in hex (e.g., 'FF0000' for red)
 */
export async function assertRunColor(docxBuffer, paragraphIndex, expectedColor) {
  const { paragraphs } = await parseDOCX(docxBuffer);

  if (paragraphIndex >= paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${paragraphs.length} paragraphs.`
    );
  }

  const runs = paragraphs[paragraphIndex].runs;
  if (runs.length === 0) {
    throw new Error(`Paragraph ${paragraphIndex} has no text runs`);
  }

  const actualColor = runs[0].color;
  expect(actualColor).toBe(expectedColor);
  return runs[0];
}

/**
 * Assert that a paragraph's first run has expected font family
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} expectedFont - Expected font name
 */
export async function assertRunFont(docxBuffer, paragraphIndex, expectedFont) {
  const { paragraphs } = await parseDOCX(docxBuffer);

  if (paragraphIndex >= paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${paragraphs.length} paragraphs.`
    );
  }

  const runs = paragraphs[paragraphIndex].runs;
  if (runs.length === 0) {
    throw new Error(`Paragraph ${paragraphIndex} has no text runs`);
  }

  const actualFont = runs[0].font;
  expect(actualFont).toBe(expectedFont);
  return runs[0];
}

/**
 * Assert that a paragraph has a specific property value
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @param {number} paragraphIndex - Zero-based paragraph index
 * @param {string} propertyName - Property name
 * @param {any} expectedValue - Expected value
 */
export async function assertParagraphProperty(
  docxBuffer,
  paragraphIndex,
  propertyName,
  expectedValue
) {
  const { paragraphs } = await parseDOCX(docxBuffer);

  if (paragraphIndex >= paragraphs.length) {
    throw new Error(
      `Paragraph index ${paragraphIndex} out of range. Document has ${paragraphs.length} paragraphs.`
    );
  }

  const actualValue = paragraphs[paragraphIndex].properties[propertyName];
  expect(actualValue).toBe(expectedValue);
  return paragraphs[paragraphIndex];
}

/**
 * Get full parsed DOCX for custom assertions
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @returns {Promise<Object>} Parsed DOCX with paragraphs array
 */
export async function getParsedDOCX(docxBuffer) {
  return await parseDOCX(docxBuffer);
}
