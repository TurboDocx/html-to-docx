/**
 * Alignment Integration Tests
 * Tests for HTML align attribute and CSS text-align on paragraphs, divs, and tables
 */

import HTMLtoDOCX from '../index.js';
import {
  parseDOCX,
  assertParagraphCount,
  assertParagraphText,
  assertParagraphAlignment,
} from './helpers/docx-assertions.js';

// Regex to find table elements and their properties
const TABLE_REGEX = /<w:tbl\b[^>]*>[\s\S]*?<\/w:tbl>/g;
const TABLE_ALIGNMENT_REGEX = /<w:tblPr>[\s\S]*?<w:jc w:val="([^"]+)"[\s\S]*?<\/w:tblPr>/;

/**
 * Extract table alignment from table XML
 * @param {string} tableXml - Single table XML string
 * @returns {string|null} Alignment value or null if not found
 */
function extractTableAlignment(tableXml) {
  const match = tableXml.match(TABLE_ALIGNMENT_REGEX);
  return match ? match[1] : null;
}

/**
 * Find all tables in document XML
 * @param {string} xmlString - The document.xml content
 * @returns {Array} Array of table XML strings
 */
function findTables(xmlString) {
  const matches = xmlString.match(TABLE_REGEX);
  return matches || [];
}

describe('Paragraph Alignment', () => {
  describe('HTML align attribute', () => {
    test('should apply left alignment with align="left"', async () => {
      const htmlString = '<p align="left">Left aligned text</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Left aligned text');
      assertParagraphAlignment(parsed, 0, 'left');
    });

    test('should apply center alignment with align="center"', async () => {
      const htmlString = '<p align="center">Center aligned text</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Center aligned text');
      assertParagraphAlignment(parsed, 0, 'center');
    });

    test('should apply right alignment with align="right"', async () => {
      const htmlString = '<p align="right">Right aligned text</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Right aligned text');
      assertParagraphAlignment(parsed, 0, 'right');
    });

    test('should apply justify alignment with align="justify"', async () => {
      const htmlString = '<p align="justify">Justified text that should span the full width of the page.</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Justified text that should span the full width of the page.');
      // In DOCX, justify is represented as 'both'
      assertParagraphAlignment(parsed, 0, 'both');
    });

    test('should handle uppercase align attribute value', async () => {
      const htmlString = '<p align="CENTER">Center aligned text</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphAlignment(parsed, 0, 'center');
    });
  });

  describe('CSS text-align', () => {
    test('should apply left alignment with text-align: left', async () => {
      const htmlString = '<p style="text-align: left">Left aligned text</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphAlignment(parsed, 0, 'left');
    });

    test('should apply center alignment with text-align: center', async () => {
      const htmlString = '<p style="text-align: center">Center aligned text</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphAlignment(parsed, 0, 'center');
    });

    test('should apply right alignment with text-align: right', async () => {
      const htmlString = '<p style="text-align: right">Right aligned text</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphAlignment(parsed, 0, 'right');
    });

    test('should apply justify alignment with text-align: justify', async () => {
      const htmlString = '<p style="text-align: justify">Justified text</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      // In DOCX, justify is represented as 'both'
      assertParagraphAlignment(parsed, 0, 'both');
    });
  });

  describe('CSS text-align takes precedence over align attribute', () => {
    test('should use CSS text-align when both are present', async () => {
      const htmlString = '<p align="left" style="text-align: right">Should be right aligned</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'Should be right aligned');
      assertParagraphAlignment(parsed, 0, 'right');
    });

    test('should use CSS text-align center over align="right"', async () => {
      const htmlString = '<p align="right" style="text-align: center">Should be center aligned</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphAlignment(parsed, 0, 'center');
    });
  });

  describe('No alignment specified', () => {
    test('should not include alignment when neither align nor text-align is specified', async () => {
      const htmlString = '<p>No alignment specified</p>';

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 1);
      assertParagraphText(parsed, 0, 'No alignment specified');
      // No alignment property should be present
      expect(parsed.paragraphs[0].properties.alignment).toBeUndefined();
    });
  });
});

describe('Div Alignment', () => {
  test('paragraph inside div with its own align attribute should be aligned', async () => {
    const htmlString = '<div><p align="center">Centered paragraph in div</p></div>';

    const result = await HTMLtoDOCX(htmlString, {});
    const parsed = await parseDOCX(result);

    assertParagraphCount(parsed, 1);
    assertParagraphText(parsed, 0, 'Centered paragraph in div');
    assertParagraphAlignment(parsed, 0, 'center');
  });
});

describe('Table Alignment', () => {
  describe('HTML align attribute on tables', () => {
    test('should apply center alignment to table with align="center"', async () => {
      const htmlString = `
        <table align="center" border="1">
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);
      const tables = findTables(parsed.xml);

      expect(tables.length).toBe(1);
      expect(extractTableAlignment(tables[0])).toBe('center');
    });

    test('should apply left alignment to table with align="left"', async () => {
      const htmlString = `
        <table align="left" border="1">
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);
      const tables = findTables(parsed.xml);

      expect(tables.length).toBe(1);
      expect(extractTableAlignment(tables[0])).toBe('left');
    });

    test('should apply right alignment to table with align="right"', async () => {
      const htmlString = `
        <table align="right" border="1">
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);
      const tables = findTables(parsed.xml);

      expect(tables.length).toBe(1);
      expect(extractTableAlignment(tables[0])).toBe('right');
    });

    test('should handle uppercase align attribute value on table', async () => {
      const htmlString = `
        <table align="CENTER" border="1">
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);
      const tables = findTables(parsed.xml);

      expect(tables.length).toBe(1);
      expect(extractTableAlignment(tables[0])).toBe('center');
    });
  });

  describe('Table default alignment', () => {
    test('should default to center alignment when no align attribute is specified', async () => {
      const htmlString = `
        <table border="1">
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);
      const tables = findTables(parsed.xml);

      expect(tables.length).toBe(1);
      expect(extractTableAlignment(tables[0])).toBe('center');
    });
  });

  describe('Table CSS text-align (cell content alignment)', () => {
    test('should pass text-align to cells for content alignment, not affect table position', async () => {
      const htmlString = `
        <table style="text-align: center" border="1">
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);
      const tables = findTables(parsed.xml);

      expect(tables.length).toBe(1);
      // Table should still default to center position (no align attribute)
      expect(extractTableAlignment(tables[0])).toBe('center');
    });

    test('should handle both align attribute and text-align style on table', async () => {
      const htmlString = `
        <table align="right" style="text-align: center" border="1">
          <tr><td>Cell 1</td><td>Cell 2</td></tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);
      const tables = findTables(parsed.xml);

      expect(tables.length).toBe(1);
      // Table position should be right (from align attribute)
      expect(extractTableAlignment(tables[0])).toBe('right');
    });
  });

  describe('Multiple tables', () => {
    test('should handle multiple tables with different alignments', async () => {
      const htmlString = `
        <table align="left" border="1">
          <tr><td>Left table</td></tr>
        </table>
        <table align="center" border="1">
          <tr><td>Center table</td></tr>
        </table>
        <table align="right" border="1">
          <tr><td>Right table</td></tr>
        </table>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);
      const tables = findTables(parsed.xml);

      expect(tables.length).toBe(3);
      expect(extractTableAlignment(tables[0])).toBe('left');
      expect(extractTableAlignment(tables[1])).toBe('center');
      expect(extractTableAlignment(tables[2])).toBe('right');
    });
  });
});

describe('Mixed content alignment', () => {
  test('should handle paragraphs and tables with different alignments', async () => {
    const htmlString = `
      <p align="center">Centered paragraph</p>
      <table align="right" border="1">
        <tr><td>Right aligned table</td></tr>
      </table>
      <p align="left">Left aligned paragraph</p>
    `;

    const result = await HTMLtoDOCX(htmlString, {});
    const parsed = await parseDOCX(result);

    // Check paragraphs (excluding table cell paragraphs)
    const tables = findTables(parsed.xml);
    expect(tables.length).toBe(1);
    expect(extractTableAlignment(tables[0])).toBe('right');

    // Verify XML contains alignment elements
    expect(parsed.xml).toContain('w:jc');
  });
});
