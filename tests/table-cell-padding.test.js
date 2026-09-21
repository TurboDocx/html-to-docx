/**
 * Table Cell Padding Tests
 *
 * CSS padding on a <td>/<th> maps to <w:tcMar>, the per-cell override of the
 * table's <w:tblCellMar>. Only the sides the HTML declared are written, so a
 * cell that says nothing keeps inheriting the table default and a cell that
 * says `padding: 0` cancels it.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-validator.js';
import { assertWellFormedXML, indexOfElement } from './helpers/docx-parts.js';

/** Pull every <w:tcPr> out of document.xml. */
function findCellProperties(xml) {
  return [...xml.matchAll(/<w:tcPr\s*\/>|<w:tcPr>[\s\S]*?<\/w:tcPr>/g)].map((m) => m[0]);
}

/** Parse a <w:tcMar> into { side: twips }. */
function parseCellMargin(tcPr) {
  const tcMar = tcPr.match(/<w:tcMar>([\s\S]*?)<\/w:tcMar>/);
  if (!tcMar) return null;
  const margins = {};
  [...tcMar[1].matchAll(/<w:(top|left|bottom|right)\b([^/]*)\/>/g)].forEach((match) => {
    const width = match[2].match(/w:w="([^"]+)"/);
    const type = match[2].match(/w:type="([^"]+)"/);
    margins[match[1]] = { width: Number(width[1]), type: type[1] };
  });
  return margins;
}

async function convertCell(cellHtml) {
  const buffer = await HTMLtoDOCX(`<table><tr>${cellHtml}</tr></table>`, null, {}, null);
  const parsed = await parseDOCX(buffer);
  assertWellFormedXML(parsed.xml, 'document.xml');
  return parsed.xml;
}

describe('table cell padding', () => {
  describe('shorthand', () => {
    it('should write all four sides from a one-value shorthand', async () => {
      const xml = await convertCell('<td style="padding: 8px">x</td>');
      // 8px * 15 twips = 120
      expect(parseCellMargin(findCellProperties(xml)[0])).toEqual({
        top: { width: 120, type: 'dxa' },
        left: { width: 120, type: 'dxa' },
        bottom: { width: 120, type: 'dxa' },
        right: { width: 120, type: 'dxa' },
      });
    });

    it('should read a two-value shorthand as vertical then horizontal', async () => {
      const xml = await convertCell('<td style="padding: 4px 8px">x</td>');
      const margins = parseCellMargin(findCellProperties(xml)[0]);
      expect(margins.top.width).toBe(60);
      expect(margins.bottom.width).toBe(60);
      expect(margins.left.width).toBe(120);
      expect(margins.right.width).toBe(120);
    });

    it('should read a three-value shorthand as top, horizontal, bottom', async () => {
      const xml = await convertCell('<td style="padding: 2px 4px 8px">x</td>');
      const margins = parseCellMargin(findCellProperties(xml)[0]);
      expect(margins.top.width).toBe(30);
      expect(margins.left.width).toBe(60);
      expect(margins.right.width).toBe(60);
      expect(margins.bottom.width).toBe(120);
    });

    it('should read a four-value shorthand clockwise from the top', async () => {
      const xml = await convertCell('<td style="padding: 1px 2px 3px 4px">x</td>');
      const margins = parseCellMargin(findCellProperties(xml)[0]);
      expect(margins.top.width).toBe(15);
      expect(margins.right.width).toBe(30);
      expect(margins.bottom.width).toBe(45);
      expect(margins.left.width).toBe(60);
    });
  });

  describe('per-side properties', () => {
    it('should write only the sides that were declared', async () => {
      const xml = await convertCell('<td style="padding-left: 10px">x</td>');
      expect(parseCellMargin(findCellProperties(xml)[0])).toEqual({
        left: { width: 150, type: 'dxa' },
      });
    });

    it('should let a longhand after a shorthand override one side', async () => {
      const xml = await convertCell('<td style="padding: 8px; padding-left: 0">x</td>');
      const margins = parseCellMargin(findCellProperties(xml)[0]);
      expect(margins.top.width).toBe(120);
      expect(margins.right.width).toBe(120);
      expect(margins.bottom.width).toBe(120);
      expect(margins.left.width).toBe(0);
    });

    it('should apply padding on a <th> as well as a <td>', async () => {
      const buffer = await HTMLtoDOCX(
        '<table><thead><tr><th style="padding: 6px">h</th></tr></thead></table>',
        null,
        {},
        null
      );
      const parsed = await parseDOCX(buffer);
      expect(parseCellMargin(findCellProperties(parsed.xml)[0]).top.width).toBe(90);
    });
  });

  describe('units', () => {
    it('should convert pt, cm and in to twips', async () => {
      const xml = await convertCell(
        '<td style="padding-top: 6pt">a</td>' +
          '<td style="padding-top: 1cm">b</td>' +
          '<td style="padding-top: 0.5in">c</td>'
      );
      const cells = findCellProperties(xml);
      // 6pt * 20 = 120 twips
      expect(parseCellMargin(cells[0]).top.width).toBe(120);
      // 1cm ≈ 567 twips; the shared cm converter rounds to whole points first,
      // so it lands on 28pt = 560.
      expect(parseCellMargin(cells[1]).top.width).toBe(560);
      // 0.5in * 1440 = 720 twips
      expect(parseCellMargin(cells[2]).top.width).toBe(720);
    });

    it('should accept a unitless zero and write an explicit zero', async () => {
      const xml = await convertCell('<td style="padding: 0">x</td>');
      expect(parseCellMargin(findCellProperties(xml)[0])).toEqual({
        top: { width: 0, type: 'dxa' },
        left: { width: 0, type: 'dxa' },
        bottom: { width: 0, type: 'dxa' },
        right: { width: 0, type: 'dxa' },
      });
    });
  });

  describe('invalid input', () => {
    it.each([
      ['a percentage', '<td style="padding: 10%">x</td>'],
      ['a negative length', '<td style="padding: -4px">x</td>'],
      ['a relative unit', '<td style="padding: 2em">x</td>'],
      ['a non-zero unitless number', '<td style="padding: 8">x</td>'],
      ['a keyword', '<td style="padding: auto">x</td>'],
      ['more than four values', '<td style="padding: 1px 2px 3px 4px 5px">x</td>'],
      ['a shorthand with one broken part', '<td style="padding: 4px nonsense">x</td>'],
    ])('should ignore %s', async (_label, cellHtml) => {
      const xml = await convertCell(cellHtml);
      expect(xml).not.toContain('<w:tcMar>');
    });

    it('should ignore padding on an element that is not a cell', async () => {
      const buffer = await HTMLtoDOCX('<p style="padding: 8px">x</p>', null, {}, null);
      const parsed = await parseDOCX(buffer);
      expect(parsed.xml).not.toContain('<w:tcMar>');
    });
  });

  describe('unchanged output when nothing is declared', () => {
    it('should emit no <w:tcMar> and keep the table default', async () => {
      const xml = await convertCell('<td>x</td>');
      expect(xml).not.toContain('<w:tcMar>');
      // The hardcoded table-level default still governs the cell.
      expect(xml).toContain('<w:tblCellMar>');
    });

    it('should not change a cell that declares other properties', async () => {
      const withoutPadding = await convertCell(
        '<td style="background-color: #eeeeee; vertical-align: top">x</td>'
      );
      expect(withoutPadding).not.toContain('<w:tcMar>');
      expect(withoutPadding).toContain('<w:shd w:val="clear" w:fill="eeeeee"/>');
      expect(withoutPadding).toContain('<w:vAlign w:val="top"/>');
    });

    it('should not leak a cell padding into a nested table', async () => {
      const buffer = await HTMLtoDOCX(
        '<table><tr><td style="padding: 8px">' +
          '<table><tr><td>inner</td></tr></table>' +
          '</td></tr></table>',
        null,
        {},
        null
      );
      const parsed = await parseDOCX(buffer);
      const cellMargins = parsed.xml.match(/<w:tcMar>/g) || [];
      expect(cellMargins).toHaveLength(1);
    });
  });

  describe('element order inside <w:tcPr>', () => {
    it('should place <w:tcMar> after <w:shd> and before <w:vAlign>', async () => {
      const xml = await convertCell(
        '<td colspan="2" style="padding: 8px; background-color: #eeeeee; vertical-align: top">x</td>'
      );
      const tcPr = findCellProperties(xml)[0];
      const gridSpan = indexOfElement(tcPr, /<w:gridSpan\b/);
      const shd = indexOfElement(tcPr, /<w:shd\b/);
      const tcMar = indexOfElement(tcPr, /<w:tcMar\b/);
      const vAlign = indexOfElement(tcPr, /<w:vAlign\b/);
      expect(gridSpan).toBeGreaterThanOrEqual(0);
      expect(gridSpan).toBeLessThan(shd);
      expect(shd).toBeLessThan(tcMar);
      expect(tcMar).toBeLessThan(vAlign);
    });

    it('should place <w:tcW> and <w:tcBorders> around <w:tcMar> in spec order', async () => {
      const xml = await convertCell(
        '<td style="width: 100px; border: 1px solid red; padding: 8px">x</td>'
      );
      const tcPr = findCellProperties(xml)[0];
      const tcW = indexOfElement(tcPr, /<w:tcW\b/);
      const tcBorders = indexOfElement(tcPr, /<w:tcBorders\b/);
      const tcMar = indexOfElement(tcPr, /<w:tcMar\b/);
      expect(tcW).toBeGreaterThanOrEqual(0);
      expect(tcW).toBeLessThan(tcBorders);
      expect(tcBorders).toBeLessThan(tcMar);
    });

    it('should write <w:tcMar> sides in top, left, bottom, right order', async () => {
      const xml = await convertCell('<td style="padding: 1px 2px 3px 4px">x</td>');
      const tcMar = findCellProperties(xml)[0].match(/<w:tcMar>([\s\S]*?)<\/w:tcMar>/)[1];
      const sides = [...tcMar.matchAll(/<w:(top|left|bottom|right)\b/g)].map((m) => m[1]);
      expect(sides).toEqual(['top', 'left', 'bottom', 'right']);
    });
  });
});
