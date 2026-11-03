/**
 * Table cell border widths, as drawn.
 *
 * A border's width goes to Word in eighths of a point: a CSS pixel is 3/4 of
 * a point, so 6 eighths. The width used to pass through half points and then
 * whole points on the way, so 1px came out as 1pt (1.33px), 2px as 2pt and
 * 3px as 3pt (4px) — every table's lines heavier in Word and in the PDF than
 * in the editor that drew them, and rows with them taller (found 2026-11-03).
 * Paragraph borders were already exact.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const cellBorderSizes = (xml) =>
  [...xml.matchAll(/<w:tcBorders>([\s\S]*?)<\/w:tcBorders>/g)].flatMap((m) =>
    [...m[1].matchAll(/<w:(top|left|bottom|right)\b[^>]*w:sz="(\d+)"/g)].map((s) => Number(s[2]))
  );

const sizesFor = async (border) => {
  const html = `<table style="border-collapse: collapse;"><tr><td style="border-top: ${border}; border-bottom: ${border}; border-left: ${border}; border-right: ${border}">A</td></tr></table>`;
  const { xml } = await parseDOCX(await HTMLtoDOCX(html, {}));
  return cellBorderSizes(xml);
};

describe('table cell border widths', () => {
  test.each([
    ['1px solid #666666', 6],
    ['2px dashed #666666', 12],
    ['3px dotted #C0392B', 18],
    ['1.5px solid #000000', 9],
    ['1pt solid #000000', 8],
    ['0.5pt solid #000000', 4],
  ])('%s is %i eighths of a point on every side', async (border, eighths) => {
    const sizes = await sizesFor(border);
    expect(sizes).toHaveLength(4);
    expect(new Set(sizes)).toEqual(new Set([eighths]));
  });
});
