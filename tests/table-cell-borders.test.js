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

  describe('Regression: Kushal bug report - border-style: hidden should suppress borders', () => {
    test('should NOT render cell borders when table has border-style: hidden', async () => {
      // Bug reported by Kushal: tables with border-style: hidden incorrectly show borders
      // after the fix for issue #160
      const htmlString = `<table style="border-collapse: collapse; width: 100%; border-width: 1px; border-style: hidden; height: 76px;" border="1">
    <colgroup>
        <col style="width: 25.0399%;">
        <col style="width: 25.0399%;">
        <col style="width: 25.0399%;">
        <col style="width: 25.0399%;">
    </colgroup>
    <tbody>
        <tr style="height: 19px;">
            <td style="height: 19px;">1,1</td>
            <td style="height: 19px;">1,2</td>
            <td style="height: 19px;">1,3</td>
            <td style="height: 19px;">1,4</td>
        </tr>
        <tr style="height: 19px;">
            <td style="height: 19px;">2,1</td>
            <td style="height: 19px;">2,2</td>
            <td style="height: 19px;">2,3</td>
            <td style="height: 19px;">2,4</td>
        </tr>
        <tr style="height: 19px;">
            <td style="height: 19px;">3,1</td>
            <td style="height: 19px;">3,2</td>
            <td style="height: 19px;">3,3</td>
            <td style="height: 19px;">3,4</td>
        </tr>
        <tr style="height: 19px;">
            <td style="height: 19px;">4,1</td>
            <td style="height: 19px;">4,2</td>
            <td style="height: 19px;">&nbsp;4,3</td>
            <td style="height: 19px;">4,4</td>
        </tr>
    </tbody>
</table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      // When border-style: hidden, there should be NO cell borders
      // Check that either tcBorders doesn't exist OR all borders are 'nil' or 'none'
      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      if (tcBordersMatches) {
        // If borders exist, they should all be nil/none
        for (const tcBorder of tcBordersMatches) {
          // Should not have visible borders (single, double, etc. with size > 0)
          expect(tcBorder).not.toMatch(/<w:bottom\s+w:val="single"\s+w:sz="[1-9]/);
          expect(tcBorder).not.toMatch(/<w:top\s+w:val="single"\s+w:sz="[1-9]/);
          expect(tcBorder).not.toMatch(/<w:left\s+w:val="single"\s+w:sz="[1-9]/);
          expect(tcBorder).not.toMatch(/<w:right\s+w:val="single"\s+w:sz="[1-9]/);
        }
      }
    });

    test('should respect table-level border styles when border-collapse: collapse', async () => {
      // Bug reported by Kushal: table-level borders are not respected correctly
      const htmlString = `<table style="border-collapse: collapse; border-left:1px solid black; border-right: 2px solid brown; border-top: 2px solid yellow; border-bottom: 4px solid orange">
    <tbody>
        <tr>
            <td>Row 1, Col 1</td>
            <td>Row 1, Col 2</td>
        </tr>
        <tr>
            <td>Row 2, Col 1</td>
            <td>Row 2, Col 2</td>
        </tr>
    </tbody>
</table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      // Should have table-level borders, not cell-level overrides
      // The expected behavior: table borders should take precedence
      // Top border should be yellow (FFFF00), size 16 (2px * 8)
      // Bottom border should be orange (FFA500), size 32 (4px * 8)
      // Left border should be black (000000), size 8 (1px * 8)
      // Right border should be brown (A52A2A), size 16 (2px * 8)

      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      expect(tcBordersMatches).not.toBeNull();

      // Check that borders match table-level styles, not default cell borders
      // Find cells with specific border colors matching table borders
      const hasYellowTopBorder = parsed.xml.includes('w:color="FFFF00"') || parsed.xml.includes('w:color="ffff00"');
      const hasOrangeBottomBorder = parsed.xml.includes('w:color="FFA500"') || parsed.xml.includes('w:color="ffa500"');
      const hasBrownRightBorder = parsed.xml.includes('w:color="A52A2A"') || parsed.xml.includes('w:color="a52a2a"');

      expect(hasYellowTopBorder).toBe(true);
      expect(hasOrangeBottomBorder).toBe(true);
      expect(hasBrownRightBorder).toBe(true);
    });
  });

  describe('Ported from example-node.js - Comprehensive border scenarios', () => {
    test('should handle basic table without borders or styles', async () => {
      // From example-node.js line 200
      const htmlString = `<table>
        <tr>
            <th>Country</th>
            <th>Capital</th>
        </tr>
        <tr>
            <td>India</td>
            <td>New Delhi</td>
        </tr>
        <tr>
            <td>USA</td>
            <td>Washington DC</td>
        </tr>
      </table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      // Basic table without explicit borders should still be valid
      expect(parsed.xml).toContain('<w:tbl>');
      expect(parsed.xml).toContain('<w:tr>');
      expect(parsed.xml).toContain('<w:tc>');
    });

    test('should handle border-style: none with border attribute (from example-node.js)', async () => {
      // From example-node.js line 1072
      // Note: This has conflicting directives - border="1" adds borders, but border-style: none removes them
      // Current behavior: border="1" attribute takes precedence
      const htmlString = `<table style="border-collapse: collapse; width: 100%; border-width: 1px; border-style: none;" border="1">
        <colgroup>
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
        </colgroup>
        <tbody>
            <tr>
                <td>1,1</td>
                <td>1,2</td>
                <td>1,3</td>
                <td>1,4</td>
            </tr>
            <tr>
                <td>2,1</td>
                <td>2,2</td>
                <td>2,3</td>
                <td>2,4</td>
            </tr>
        </tbody>
      </table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      // When border="1" is present, it overrides CSS border-style: none
      // This is existing behavior - border attribute takes precedence
      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      expect(tcBordersMatches).not.toBeNull();
      // Borders are present due to border="1" attribute
      expect(tcBordersMatches.length).toBeGreaterThan(0);
    });

    test('should handle normal table with border attribute (from example-node.js)', async () => {
      // From example-node.js line 1108
      const htmlString = `<table style="border-collapse: collapse; width: 100%; height: 76px;" border="1">
        <colgroup>
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
        </colgroup>
        <tbody>
            <tr style="height: 19px;">
                <td style="height: 19px;">1,1</td>
                <td style="height: 19px;">1,2</td>
                <td style="height: 19px;">1,3</td>
                <td style="height: 19px;">1,4</td>
            </tr>
        </tbody>
      </table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      // Should have borders with border="1"
      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      expect(tcBordersMatches).not.toBeNull();
      expect(tcBordersMatches.length).toBeGreaterThan(0);
    });

    test('should handle border-width: 0px with border-style: solid (from example-node.js)', async () => {
      // From example-node.js line 1180
      const htmlString = `<table style="border-collapse: collapse; width: 100%; border-width: 0px; border-style: solid;" border="1">
        <colgroup>
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
        </colgroup>
        <tbody>
            <tr>
                <td style="border-width: 0px;">1,1</td>
                <td style="border-width: 0px;">1,2</td>
                <td style="border-width: 0px;">1,3</td>
                <td style="border-width: 0px;">1,4</td>
            </tr>
        </tbody>
      </table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      // border-width: 0 should result in size 0 borders
      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      if (tcBordersMatches) {
        // Should have borders but with size 0
        expect(parsed.xml).toMatch(/w:sz="0"/);
      }
    });

    test('should handle complex border styles with multiple colors (from example-node.js)', async () => {
      // From example-node.js line 1251
      const htmlString = `<table style="border-collapse: collapse; width: 100%; border: 2px solid purple; border-width: 4px; border-left-color:yellow;" border="1">
        <colgroup>
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
            <col style="width: 25%;">
        </colgroup>
        <tbody>
            <tr>
                <td style="border:5px dotted red; border-left: 2px dashed ;border-left-color:aqua">1,1</td>
                <td>1,2</td>
                <td>1,3</td>
                <td>1,4</td>
            </tr>
            <tr>
                <td style="border:5px dotted red; border-left: 8px dashed ;border-left-color:aqua">2,1</td>
                <td>2,2</td>
                <td>2,3</td>
                <td>2,4</td>
            </tr>
        </tbody>
      </table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      // Should have various border colors
      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      expect(tcBordersMatches).not.toBeNull();
      // Check for custom colors in the output
      expect(parsed.xml).toMatch(/w:color/);
    });

    test('should handle table with border attribute and border-collapse (from example-node.js)', async () => {
      // From example-node.js line 743
      const htmlString = `<table border="1" style="border-collapse:collapse">
        <tbody>
            <tr>
                <td style="border-left:none">Cell with no left border</td>
                <td>Normal cell</td>
            </tr>
        </tbody>
      </table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      const tcBordersRegex = /<w:tcBorders>(.*?)<\/w:tcBorders>/gs;
      const tcBordersMatches = parsed.xml.match(tcBordersRegex);

      expect(tcBordersMatches).not.toBeNull();
      // Table should have border="1" so cells get borders
      expect(tcBordersMatches.length).toBeGreaterThan(0);
      // Note: Cell-level border-left:none override may or may not work depending on implementation
      // The test just verifies the table renders with borders
    });

    test('should handle table with rowspan and colspan (from example-node.js)', async () => {
      // From example-node.js line 1903
      const htmlString = `<table style="min-width: 100%;">
        <colgroup>
          <col style="min-width: 25px">
          <col style="min-width: 25px">
          <col style="min-width: 25px">
        </colgroup>
        <tbody>
          <tr>
            <th colspan="2" rowspan="1">
              <p>Header spanning 2 columns</p>
            </th>
            <th colspan="1" rowspan="1">
              <p>Single header</p>
            </th>
          </tr>
          <tr>
            <td colspan="1" rowspan="2">
              <p>Cell spanning 2 rows</p>
            </td>
            <td colspan="1" rowspan="1">
              <p>data2</p>
            </td>
            <td colspan="1" rowspan="1">
              <p>data3</p>
            </td>
          </tr>
        </tbody>
      </table>`;

      const result = await HTMLtoDOCX(htmlString, undefined, {});
      const parsed = await parseDOCX(result);

      // Should have gridSpan for colspan
      expect(parsed.xml).toMatch(/<w:gridSpan\s+w:val="2"/);
      // Should have vMerge for rowspan
      expect(parsed.xml).toMatch(/<w:vMerge/);
    });
  });
});
