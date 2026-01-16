/**
 * Table Cell Borders Test Suite
 * Tests for GitHub Issue #160: Bottom border missing in table cells
 *
 * This test file validates that table cell borders are correctly rendered
 * in the generated DOCX files, specifically testing the fix for missing
 * bottom borders.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

/**
 * Helper function to check if XML contains a specific border element
 * @param {string} xml - The document XML string
 * @param {string} borderSide - The border side (top, bottom, left, right)
 * @param {Object} expectedAttrs - Expected attributes { val, sz, color }
 * @returns {boolean} True if border element exists with expected attributes
 */
function assertTableCellBorder(xml, borderSide, expectedAttrs = {}) {
  // Find all <w:tcBorders> elements (table cell borders)
  const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
  const tcBordersMatches = xml.match(tcBordersRegex);

  expect(tcBordersMatches).not.toBeNull();
  expect(tcBordersMatches.length).toBeGreaterThan(0);

  // Check if any tcBorders contains the specified border element
  let foundBorder = false;
  for (const tcBordersBlock of tcBordersMatches) {
    // Build regex for the specific border side
    const borderRegex = new RegExp(
      `<w:${borderSide}\\s+([^>]+)\\s*\\/>`
    );
    const borderMatch = tcBordersBlock.match(borderRegex);

    if (borderMatch) {
      foundBorder = true;
      const attributes = borderMatch[1];

      // Verify expected attributes if provided
      if (expectedAttrs.val) {
        expect(attributes).toContain(`w:val="${expectedAttrs.val}"`);
      }
      if (expectedAttrs.sz !== undefined) {
        expect(attributes).toContain(`w:sz="${expectedAttrs.sz}"`);
      }
      if (expectedAttrs.color) {
        expect(attributes).toContain(`w:color="${expectedAttrs.color}"`);
      }
      if (expectedAttrs.space !== undefined) {
        expect(attributes).toContain(`w:space="${expectedAttrs.space}"`);
      }

      break; // Found matching border
    }
  }

  expect(foundBorder).toBe(true);
}

describe('Table Cell Borders - Issue #160 Regression Tests', () => {
  describe('Exact bug from Issue #160', () => {
    test('should render bottom border - exact example from issue reporter', async () => {
      // EXACT code from Issue #160 report by dt-eric-lefevreardant
      // Original issue: https://github.com/TurboDocx/html-to-docx/issues/160
      const htmlString = '<table><tr><td>left</td><td>right</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 1,
            stroke: 'single',
            color: '000000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      // Before fix: <w:tcBorders> only contained <w:top> and <w:left>
      // After fix: should contain all four borders including <w:bottom>
      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      expect(tcBordersMatches).not.toBeNull();
      expect(tcBordersMatches.length).toBeGreaterThan(0);

      // Verify bottom border exists as reported missing in the issue
      const bottomBorderRegex = /<w:bottom\s+w:val="single"\s+w:sz="1"\s+w:space="0"\s+w:color="000000"\s*\/>/;
      const hasBottomBorder = tcBordersMatches.every((tcBorders) =>
        bottomBorderRegex.test(tcBorders)
      );
      expect(hasBottomBorder).toBe(true);

      // Also verify right border (also reported missing)
      const rightBorderRegex = /<w:right\s+w:val="single"\s+w:sz="1"\s+w:space="0"\s+w:color="000000"\s*\/>/;
      const hasRightBorder = tcBordersMatches.some((tcBorders) => rightBorderRegex.test(tcBorders));
      expect(hasRightBorder).toBe(true);
    });
  });

  describe('Basic border rendering', () => {
    test('should include bottom border when specified with borderOptions', async () => {
      // This is the exact example from GitHub Issue #160
      const htmlString = '<table><tr><td>left</td><td>right</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 1,
            stroke: 'single',
            color: '000000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      // The bug: bottom border is missing from the generated XML
      // After fix: should find <w:bottom w:val="single" w:sz="1" w:space="0" w:color="000000"/>
      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'single',
        sz: '1',
        space: '0',
        color: '000000',
      });
    });

    test('should include all four borders (top, bottom, left, right)', async () => {
      const htmlString = '<table><tr><td>cell content</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 2,
            stroke: 'single',
            color: 'FF0000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      // All four borders should be present
      assertTableCellBorder(parsed.xml, 'top', {
        val: 'single',
        sz: '2',
        color: 'FF0000',
      });

      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'single',
        sz: '2',
        color: 'FF0000',
      });

      assertTableCellBorder(parsed.xml, 'left', {
        val: 'single',
        sz: '2',
        color: 'FF0000',
      });

      assertTableCellBorder(parsed.xml, 'right', {
        val: 'single',
        sz: '2',
        color: 'FF0000',
      });
    });
  });

  describe('Different stroke styles', () => {
    test('should render bottom border with dashed stroke', async () => {
      const htmlString = '<table><tr><td>test</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 1,
            stroke: 'dashed',
            color: '000000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'dashed',
      });
    });

    test('should render bottom border with dotted stroke', async () => {
      const htmlString = '<table><tr><td>test</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 1,
            stroke: 'dotted',
            color: '000000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'dotted',
      });
    });

    test('should render bottom border with double stroke', async () => {
      const htmlString = '<table><tr><td>test</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 2,
            stroke: 'double',
            color: '000000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'double',
      });
    });
  });

  describe('Custom colors', () => {
    test('should render bottom border with custom color', async () => {
      const htmlString = '<table><tr><td>test</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 1,
            stroke: 'single',
            color: 'FF0000', // Red
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'single',
        color: 'FF0000',
      });
    });

    test('should render bottom border with blue color', async () => {
      const htmlString = '<table><tr><td>test</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 1,
            stroke: 'single',
            color: '0000FF', // Blue
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'single',
        color: '0000FF',
      });
    });
  });

  describe('Complex tables', () => {
    test('should render borders in multi-row tables', async () => {
      const htmlString = `
        <table>
          <tr><td>Row 1 Cell 1</td><td>Row 1 Cell 2</td></tr>
          <tr><td>Row 2 Cell 1</td><td>Row 2 Cell 2</td></tr>
          <tr><td>Row 3 Cell 1</td><td>Row 3 Cell 2</td></tr>
        </table>
      `;
      const options = {
        table: {
          borderOptions: {
            size: 1,
            stroke: 'single',
            color: '000000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      // Bottom borders should exist for all cells
      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'single',
        sz: '1',
        color: '000000',
      });
    });

    test('should render borders in tables with headers', async () => {
      const htmlString = `
        <table>
          <thead>
            <tr><th>Header 1</th><th>Header 2</th></tr>
          </thead>
          <tbody>
            <tr><td>Data 1</td><td>Data 2</td></tr>
          </tbody>
        </table>
      `;
      const options = {
        table: {
          borderOptions: {
            size: 2,
            stroke: 'single',
            color: '333333',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      // All borders including bottom should be present
      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'single',
        sz: '2',
        color: '333333',
      });
    });
  });

  describe('Edge cases', () => {
    test('should handle table with single cell', async () => {
      const htmlString = '<table><tr><td>single cell</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 1,
            stroke: 'single',
            color: '000000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      assertTableCellBorder(parsed.xml, 'bottom', {
        val: 'single',
      });
    });

    test('should handle zero-width borders (hidden)', async () => {
      const htmlString = '<table><tr><td>test</td></tr></table>';
      const options = {
        table: {
          borderOptions: {
            size: 0,
            stroke: 'nil',
            color: '000000',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, undefined, options);
      const parsed = await parseDOCX(result);

      // With size 0 and nil stroke, borders may not be generated at all
      // This is expected behavior - no visible borders means no border elements needed
      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      // Either no borders exist (most likely) or borders exist with nil/0 values
      if (tcBordersMatches) {
        // If borders do exist, they should have nil stroke and size 0
        assertTableCellBorder(parsed.xml, 'bottom', {
          val: 'nil',
          sz: '0',
        });
      } else {
        // No borders is also acceptable for zero-width/nil borders
        expect(tcBordersMatches).toBeNull();
      }
    });
  });
});
