/**
 * Table Cell Border Tests
 *
 * Regression coverage for the fixupTableCellBorder fix that swapped
 * borderColor / borderStrike initialization between the colors and strokes
 * fields. When a cell overrode only a per-side color (or only a per-side
 * style), the un-overridden field would be initialized from the wrong
 * source and end up writing e.g. a color value into the style slot.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const VALID_BORDER_STYLES = new Set([
  'single',
  'double',
  'dashed',
  'dotted',
  'thick',
  'thin',
  'wave',
  'nil',
  'none',
]);

const HEX_RE = /^[0-9A-Fa-f]{6}$/;

/**
 * Pull every <w:tcBorders> element out of the document.xml.
 */
function findCellBorders(xml) {
  return [...xml.matchAll(/<w:tcBorders>([\s\S]*?)<\/w:tcBorders>/g)].map((m) => m[1]);
}

/**
 * Parse a single side element like `<w:top w:val="single" w:sz="4" w:color="FF0000"/>`.
 */
function parseSide(tcBorders, side) {
  const re = new RegExp(`<w:${side}\\b([^/]+)/>`);
  const m = tcBorders.match(re);
  if (!m) return null;
  const attrs = m[1];
  const val = attrs.match(/w:val="([^"]+)"/);
  const color = attrs.match(/w:color="([^"]+)"/);
  return {
    val: val ? val[1] : null,
    color: color ? color[1] : null,
  };
}

/**
 * Iterate every side of every <w:tcBorders> in the document and assert the
 * style/color slot invariant. Returns the number of border sides checked.
 */
function assertNoSwappedSlots(xml) {
  const borders = findCellBorders(xml);
  expect(borders.length).toBeGreaterThan(0);
  let checked = 0;
  for (const tcBorders of borders) {
    for (const side of ['top', 'bottom', 'left', 'right']) {
      const parsed = parseSide(tcBorders, side);
      if (!parsed) continue;
      // The val (style) slot must never contain a hex color.
      expect(VALID_BORDER_STYLES.has(parsed.val)).toBe(true);
      // The color slot must always be a 6-hex color, never a style word.
      if (parsed.color !== null) {
        expect(parsed.color).toMatch(HEX_RE);
      }
      checked += 1;
    }
  }
  return checked;
}

describe('Table cell border fixup (PR #186)', () => {
  // The bug manifests when a cell bumps border-*-width above the table-level
  // size without also setting the matching style/color. The fixup function
  // then writes back per-side state, and the un-overridden initial values
  // would end up in the wrong slot — color hex written into the style val
  // and the style word written into the color attribute.

  test('cell bumping border-top-width keeps style/color slots correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr><td style="border-top-width: 4px;">A</td></tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('cell bumping border-bottom-width keeps style/color slots correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr><td style="border-bottom-width: 4px;">A</td></tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('cell bumping border-left-width keeps style/color slots correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr><td style="border-left-width: 4px;">A</td></tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('cell bumping border-right-width keeps style/color slots correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr><td style="border-right-width: 4px;">A</td></tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('cell bumping width on all four sides at once stays correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr>
          <td style="border-top-width: 4px; border-bottom-width: 4px; border-left-width: 4px; border-right-width: 4px;">All sides wider</td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('multi-row table — first-row top and last-row bottom both stay correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr><td style="border-top-width: 5px;">Row 1 wider top</td></tr>
        <tr><td>Middle row</td></tr>
        <tr><td style="border-bottom-width: 5px;">Row 3 wider bottom</td></tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('multi-column row — first-col left and last-col right both stay correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr>
          <td style="border-left-width: 5px;">Col 1 wider left</td>
          <td>Middle col</td>
          <td style="border-right-width: 5px;">Col 3 wider right</td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('row-level style on <tr> propagates through fixup and keeps slots correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr style="border-top-width: 6px;">
          <td>A</td>
          <td>B</td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('border shorthand on a cell coexisting with a single-side override stays correct', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr>
          <td style="border: 2px solid #008000; border-top-color: #ff8800;">A</td>
          <td style="border: 2px solid #008000; border-bottom-style: dashed;">B</td>
          <td style="border: 2px solid #008000; border-left-width: 5px;">C</td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('cell border-style: hidden produces a valid nil/hidden val and no swap on other sides', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr>
          <td style="border-top-style: hidden; border-bottom-width: 5px;">A</td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('cell with rowspan and per-side width bump still keeps slots valid', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr>
          <td rowspan="2" style="border-top-width: 5px; border-left-width: 5px;">Span</td>
          <td>R1c2</td>
        </tr>
        <tr>
          <td>R2c2</td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('cell with colspan and per-side width bump still keeps slots valid', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr>
          <td colspan="2" style="border-bottom-width: 5px;">Spans two columns</td>
        </tr>
        <tr>
          <td>R2c1</td>
          <td>R2c2</td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('conflicting shorthand and per-side definitions on the same cell stay valid', async () => {
    const html = `
      <table border="1" style="border-collapse: collapse;">
        <tr>
          <td style="border: 1px solid red; border-top: 3px dashed blue;">Conflict 1</td>
          <td style="border-top: 3px dashed blue; border: 1px solid red;">Conflict 2 (reverse order)</td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('empty table does not crash and produces no malformed borders', async () => {
    const buf = await HTMLtoDOCX('<table border="1"></table>', {});
    const { xml } = await parseDOCX(buf);
    const borders = findCellBorders(xml);
    // Either zero borders or each is valid — both are acceptable.
    for (const tcBorders of borders) {
      for (const side of ['top', 'bottom', 'left', 'right']) {
        const parsed = parseSide(tcBorders, side);
        if (parsed) expect(VALID_BORDER_STYLES.has(parsed.val)).toBe(true);
      }
    }
  });

  test('single-row single-cell tiny table still produces valid border slots', async () => {
    const buf = await HTMLtoDOCX('<table border="1"><tr><td>only</td></tr></table>', {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });

  test('table with no border attribute and a per-side cell width bump stays valid', async () => {
    // No table-level border — exercises path where tableCellBorder is initialized empty.
    const html = `
      <table style="border-collapse: collapse;">
        <tr><td style="border-top-width: 4px;">A</td></tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    const borders = findCellBorders(xml);
    // If no borders are emitted that's fine; if any are, they must be valid.
    for (const tcBorders of borders) {
      for (const side of ['top', 'bottom', 'left', 'right']) {
        const parsed = parseSide(tcBorders, side);
        if (parsed) expect(VALID_BORDER_STYLES.has(parsed.val)).toBe(true);
      }
    }
  });

  test('deeply nested tables (3 levels) keep border slot invariants', async () => {
    const html = `
      <table border="1"><tr><td>
        <table border="1"><tr><td>
          <table border="1"><tr><td style="border-top-width: 4px;">Deep</td></tr></table>
        </td></tr></table>
      </td></tr></table>
    `;
    const buf = await HTMLtoDOCX(html, {});
    const { xml } = await parseDOCX(buf);
    expect(assertNoSwappedSlots(xml)).toBeGreaterThan(0);
  });
});
