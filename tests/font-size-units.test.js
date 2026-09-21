/**
 * Font size unit tests: CSS font-size mapped to <w:sz> (half-points).
 *
 * px and pt convert as before (1pt = 2 half-points, 1px = 1.5 half-points,
 * rounded). Relative sizes resolve against the inherited size (em, %,
 * smaller/larger) or the document default size (rem, keywords) instead of
 * collapsing to the 5pt fallback.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const convert = async (html, options = {}) => {
  const docx = await HTMLtoDOCX(html, null, options);
  return parseDOCX(docx);
};

// Font size (half-points) of the run whose text is `text`, or undefined.
const sizeOfRun = (parsed, text) => {
  const run = parsed.paragraphs
    .flatMap((paragraph) => paragraph.runs)
    .find((candidate) => candidate.text === text);
  expect(run).toBeDefined();
  return run.fontSize;
};

describe('font-size units', () => {
  test.each([
    ['15px', 23],
    ['13px', 20],
    ['16px', 24],
    ['11pt', 22],
    ['10.5pt', 21],
  ])('keeps converting %s to %i half-points', async (value, halfPoints) => {
    const parsed = await convert(`<p><span style="font-size: ${value}">text</span></p>`);

    expect(sizeOfRun(parsed, 'text')).toBe(halfPoints);
  });

  test('resolves em against the document default size when nothing is inherited', async () => {
    const parsed = await convert('<p><span style="font-size: 1.5em">text</span></p>');

    expect(sizeOfRun(parsed, 'text')).toBe(33);
  });

  test('resolves em against the inherited span size', async () => {
    const parsed = await convert(
      '<p><span style="font-size: 20px"><span style="font-size: 1.5em">text</span></span></p>'
    );

    expect(sizeOfRun(parsed, 'text')).toBe(45);
  });

  test('resolves em against the paragraph size', async () => {
    const parsed = await convert(
      '<p style="font-size: 16px"><span style="font-size: 0.5em">text</span></p>'
    );

    expect(sizeOfRun(parsed, 'text')).toBe(12);
  });

  test('resolves rem against the document default size, not the inherited size', async () => {
    const parsed = await convert(
      '<p style="font-size: 30px"><span style="font-size: 2rem">text</span></p>'
    );

    expect(sizeOfRun(parsed, 'text')).toBe(44);
  });

  test('uses the fontSize document option as the root size', async () => {
    const parsed = await convert(
      '<p><span style="font-size: 1rem">rem</span> <span style="font-size: 0.75em">em</span></p>',
      { fontSize: 24 }
    );

    expect(sizeOfRun(parsed, 'rem')).toBe(24);
    expect(sizeOfRun(parsed, 'em')).toBe(18);
  });

  test('resolves em on a paragraph itself', async () => {
    const parsed = await convert('<p style="font-size: 1.25em">text</p>');

    expect(sizeOfRun(parsed, 'text')).toBe(28);
  });

  test.each([
    ['xx-small', 13],
    ['small', 20],
    ['medium', 22],
    ['large', 26],
    ['x-large', 33],
    ['xx-large', 44],
  ])('scales absolute keyword %s from the document default size', async (keyword, halfPoints) => {
    const parsed = await convert(`<p><span style="font-size: ${keyword}">text</span></p>`);

    expect(sizeOfRun(parsed, 'text')).toBe(halfPoints);
  });

  test.each([
    ['smaller', 25],
    ['larger', 36],
  ])('scales relative keyword %s from the inherited size', async (keyword, halfPoints) => {
    const parsed = await convert(
      `<p><span style="font-size: 20px"><span style="font-size: ${keyword}">text</span></span></p>`
    );

    expect(sizeOfRun(parsed, 'text')).toBe(halfPoints);
  });

  test('rounds percentage sizes to whole half-points', async () => {
    const parsed = await convert('<p><span style="font-size: 110%">text</span></p>');

    expect(sizeOfRun(parsed, 'text')).toBe(24);
    expect(parsed.xml).toContain('<w:sz w:val="24"/>');
    expect(parsed.xml).not.toMatch(/<w:sz w:val="\d+\.\d+"/);
  });

  test.each(['inherit', 'initial', 'var(--size)', 'bogus'])(
    'keeps the inherited size for unsupported value %s',
    async (value) => {
      const parsed = await convert(
        `<p style="font-size: 12pt"><span style="font-size: ${value}">text</span></p>`
      );

      expect(sizeOfRun(parsed, 'text')).toBe(24);
    }
  );

  test('never falls back to 5pt for unsupported values without an inherited size', async () => {
    const parsed = await convert('<p><span style="font-size: inherit">text</span></p>');

    expect(sizeOfRun(parsed, 'text')).toBeUndefined();
    expect(parsed.xml).not.toContain('<w:sz w:val="10"/>');
  });

  test('resolves em font-size set on a table row', async () => {
    const parsed = await convert('<table><tr style="font-size: 2em"><td>cell</td></tr></table>');

    expect(sizeOfRun(parsed, 'cell')).toBe(44);
  });
});
