/**
 * Table Indent Tests
 *
 * `margin-left` on a <table> maps to <w:tblInd>, the distance from the text
 * margin to the table's leading edge. Also covers <table align> (which callers
 * rely on for <w:jc>) and the per-table opt-out of the blank paragraph the
 * converter normally puts after a table.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-validator.js';
import { assertWellFormedXML, indexOfElement } from './helpers/docx-parts.js';

/** Pull every <w:tblPr> out of document.xml. */
function findTableProperties(xml) {
  return [...xml.matchAll(/<w:tblPr\s*\/>|<w:tblPr>[\s\S]*?<\/w:tblPr>/g)].map((m) => m[0]);
}

/** Parse the <w:tblInd> of a <w:tblPr> into { width, type }, or null. */
function parseTableIndent(tblPr) {
  const match = tblPr.match(/<w:tblInd\b([^/]*)\/>/);
  if (!match) return null;

  return {
    width: Number(match[1].match(/w:w="([^"]+)"/)[1]),
    type: match[1].match(/w:type="([^"]+)"/)[1],
  };
}

async function convertTable(tableHtml) {
  const buffer = await HTMLtoDOCX(tableHtml, null, {}, null);
  const parsed = await parseDOCX(buffer);
  assertWellFormedXML(parsed.xml, 'document.xml');
  return parsed.xml;
}

describe('table indent', () => {
  describe('margin-left', () => {
    it('should write <w:tblInd> in twips', async () => {
      const xml = await convertTable(
        '<table style="margin-left: 36px"><tr><td>x</td></tr></table>'
      );
      // 36px * 15 twips = 540
      expect(parseTableIndent(findTableProperties(xml)[0])).toEqual({ width: 540, type: 'dxa' });
    });

    it('should accept pt, cm and in', async () => {
      const points = await convertTable(
        '<table style="margin-left: 36pt"><tr><td>x</td></tr></table>'
      );
      expect(parseTableIndent(findTableProperties(points)[0]).width).toBe(720);

      const inches = await convertTable(
        '<table style="margin-left: 0.5in"><tr><td>x</td></tr></table>'
      );
      expect(parseTableIndent(findTableProperties(inches)[0]).width).toBe(720);

      const centimetres = await convertTable(
        '<table style="margin-left: 1cm"><tr><td>x</td></tr></table>'
      );
      // The shared cm converter rounds to whole points first: 28pt = 560.
      expect(parseTableIndent(findTableProperties(centimetres)[0]).width).toBe(560);
    });

    it('should accept a unitless zero', async () => {
      const xml = await convertTable('<table style="margin-left: 0"><tr><td>x</td></tr></table>');
      expect(parseTableIndent(findTableProperties(xml)[0])).toEqual({ width: 0, type: 'dxa' });
    });

    it.each([
      ['a negative length', 'margin-left: -36px'],
      ['a percentage', 'margin-left: 10%'],
      ['auto', 'margin-left: auto'],
      ['a relative unit', 'margin-left: 2em'],
      ['a non-zero unitless number', 'margin-left: 36'],
    ])('should ignore %s', async (_label, style) => {
      const xml = await convertTable(`<table style="${style}"><tr><td>x</td></tr></table>`);
      expect(xml).not.toContain('<w:tblInd');
    });

    it('should emit no <w:tblInd> when nothing is declared', async () => {
      const xml = await convertTable('<table><tr><td>x</td></tr></table>');
      expect(xml).not.toContain('<w:tblInd');
      // Everything else about the table is untouched.
      expect(xml).toContain('<w:tblCellMar>');
      expect(xml).toContain('<w:jc w:val="center"/>');
    });

    it('should not leak an outer table indent into a nested table', async () => {
      const xml = await convertTable(
        '<table style="margin-left: 36px"><tr><td>' +
          '<table><tr><td>inner</td></tr></table>' +
          '</td></tr></table>'
      );
      expect(xml.match(/<w:tblInd/g)).toHaveLength(1);
    });
  });

  describe('element order inside <w:tblPr>', () => {
    it('should place <w:tblInd> after <w:jc> and before <w:tblBorders>', async () => {
      const xml = await convertTable(
        '<table align="left" style="margin-left: 36px; width: 300px; border: 1px solid red">' +
          '<tr><td>x</td></tr></table>'
      );
      const tblPr = findTableProperties(xml)[0];
      const tblW = indexOfElement(tblPr, /<w:tblW\b/);
      const jc = indexOfElement(tblPr, /<w:jc\b/);
      const tblInd = indexOfElement(tblPr, /<w:tblInd\b/);
      const tblBorders = indexOfElement(tblPr, /<w:tblBorders\b/);
      const tblCellMar = indexOfElement(tblPr, /<w:tblCellMar\b/);
      expect(tblW).toBeGreaterThanOrEqual(0);
      expect(tblW).toBeLessThan(jc);
      expect(jc).toBeLessThan(tblInd);
      expect(tblInd).toBeLessThan(tblBorders);
      expect(tblBorders).toBeLessThan(tblCellMar);
    });
  });

  describe('align attribute', () => {
    it.each([
      ['left', 'left'],
      ['right', 'right'],
      ['center', 'center'],
    ])('should map align="%s" to <w:jc w:val="%s">', async (align, expected) => {
      const xml = await convertTable(`<table align="${align}"><tr><td>x</td></tr></table>`);
      expect(findTableProperties(xml)[0]).toContain(`<w:jc w:val="${expected}"/>`);
    });

    it('should default to center when no align is given', async () => {
      const xml = await convertTable('<table><tr><td>x</td></tr></table>');
      expect(findTableProperties(xml)[0]).toContain('<w:jc w:val="center"/>');
    });

    it('should ignore an unrecognised align value', async () => {
      const xml = await convertTable('<table align="middle"><tr><td>x</td></tr></table>');
      expect(findTableProperties(xml)[0]).toContain('<w:jc w:val="center"/>');
    });
  });

  describe('data-no-spacing-after', () => {
    /** Count the empty paragraphs that sit directly after a </w:tbl>. */
    function spacingParagraphsAfterTables(xml) {
      const paragraphsAfterTables =
        xml.match(/<\/w:tbl>\s*<w:p>(?:(?!<\/w:p>)[\s\S])*<\/w:p>/g) || [];

      return paragraphsAfterTables.filter((paragraph) => !paragraph.includes('<w:t ')).length;
    }

    it('should suppress the blank paragraph for that table only', async () => {
      const xml = await convertTable(
        '<table data-no-spacing-after="true"><tr><td>a</td></tr></table>' +
          '<table><tr><td>b</td></tr></table>'
      );
      expect(xml.match(/<w:tbl>/g)).toHaveLength(2);
      // Only the second table gets the trailing empty paragraph.
      expect(spacingParagraphsAfterTables(xml)).toBe(1);
    });

    it('should keep the blank paragraph when the attribute is absent', async () => {
      const xml = await convertTable('<table><tr><td>a</td></tr></table>');
      expect(spacingParagraphsAfterTables(xml)).toBe(1);
    });

    it('should keep the blank paragraph when the attribute says false', async () => {
      const xml = await convertTable(
        '<table data-no-spacing-after="false"><tr><td>a</td></tr></table>'
      );
      expect(spacingParagraphsAfterTables(xml)).toBe(1);
    });

    it('should not change the global option for other tables', async () => {
      const buffer = await HTMLtoDOCX(
        '<table data-no-spacing-after="true"><tr><td>a</td></tr></table>' +
          '<table><tr><td>b</td></tr></table>',
        null,
        { table: { addSpacingAfter: false } },
        null
      );
      const parsed = await parseDOCX(buffer);
      // The global option is off, so neither table gets a spacing paragraph.
      expect(spacingParagraphsAfterTables(parsed.xml)).toBe(0);
    });

    it('should work on a table inside a <figure>', async () => {
      const xml = await convertTable(
        '<figure><table data-no-spacing-after="true"><tr><td>a</td></tr></table></figure>'
      );
      expect(spacingParagraphsAfterTables(xml)).toBe(0);
    });
  });
});
