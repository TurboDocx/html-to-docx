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
});
