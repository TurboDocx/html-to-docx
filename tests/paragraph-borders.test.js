/**
 * Paragraph border tests: CSS border / border-{top,right,bottom,left} on
 * paragraph-level elements (<p>, <h1>-<h6>, <li>) mapped to <w:pBdr>.
 *
 * Width is written in eighths of a point (1px = 0.75pt = 6 eighths,
 * 1pt = 8 eighths) and clamped to Word's 2-96 range. Every side uses
 * w:space="1" (1pt between the border and the text).
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphCount } from './helpers/docx-assertions.js';

const convert = async (html, options = {}) => {
  const docx = await HTMLtoDOCX(html, null, options);
  return parseDOCX(docx);
};

const pBdrOf = (paragraph) => {
  const matches = paragraph.xml.match(/<w:pBdr>[\s\S]*?<\/w:pBdr>/g) || [];
  expect(matches.length).toBeLessThanOrEqual(1);
  // document.xml is pretty-printed; compare the element without indentation.
  return matches[0] ? matches[0].replace(/>\s+</g, '><') : null;
};

// Returns { top: {val, sz, space, color}, ... } for the paragraph's <w:pBdr>.
const bordersOf = (paragraph) => {
  const pBdr = pBdrOf(paragraph);
  if (!pBdr) return null;
  const sides = {};
  pBdr.replace(/<w:(top|left|bottom|right)\b([^>]*)\/>/g, (match, side, attributes) => {
    sides[side] = {};
    attributes.replace(/w:(\w+)="([^"]*)"/g, (attributeMatch, name, value) => {
      sides[side][name] = value;
      return attributeMatch;
    });
    return match;
  });
  return sides;
};

const border = (val, sz, color) => ({ val, sz, space: '1', color });

describe('Paragraph borders from CSS', () => {
  test('maps border-bottom on <p> to a single bottom border', async () => {
    const parsed = await convert('<p style="border-bottom: 1px solid #ff0000">Text</p>');

    expect(pBdrOf(parsed.paragraphs[0])).toBe(
      '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="FF0000"/></w:pBdr>'
    );
  });

  test.each([
    ['border-top', 'top', '2px dashed #00ff00', border('dashed', '12', '00FF00')],
    ['border-left', 'left', '3px dotted #0000ff', border('dotted', '18', '0000FF')],
    ['border-right', 'right', '1pt solid #123456', border('single', '8', '123456')],
    ['border-bottom', 'bottom', '4px double #abcdef', border('double', '24', 'ABCDEF')],
  ])('maps %s to <w:%s>', async (property, side, value, expected) => {
    const parsed = await convert(`<p style="${property}: ${value}">Text</p>`);

    expect(bordersOf(parsed.paragraphs[0])).toEqual({ [side]: expected });
  });

  test('border shorthand applies to all four sides in spec order', async () => {
    const parsed = await convert('<p style="border: 2px solid #333333">Text</p>');
    const expected = border('single', '12', '333333');

    expect(bordersOf(parsed.paragraphs[0])).toEqual({
      top: expected,
      left: expected,
      bottom: expected,
      right: expected,
    });
    expect(pBdrOf(parsed.paragraphs[0])).toMatch(
      /<w:pBdr><w:top [^>]*\/><w:left [^>]*\/><w:bottom [^>]*\/><w:right [^>]*\/><\/w:pBdr>/
    );
  });

  test('a side declared after the shorthand overrides that side', async () => {
    const parsed = await convert(
      '<p style="border: 1px solid #000000; border-bottom: 3px dashed #ff0000">Text</p>'
    );
    const borders = bordersOf(parsed.paragraphs[0]);

    expect(borders.top).toEqual(border('single', '6', '000000'));
    expect(borders.bottom).toEqual(border('dashed', '18', 'FF0000'));
  });

  test('a shorthand declared after a side overrides that side', async () => {
    const parsed = await convert(
      '<p style="border-top: 3px dashed #ff0000; border: 1px solid #000000">Text</p>'
    );

    expect(bordersOf(parsed.paragraphs[0]).top).toEqual(border('single', '6', '000000'));
  });

  test('border-<side>: none removes a side set by the shorthand', async () => {
    const parsed = await convert(
      '<p style="border: 1px solid #000000; border-left: none; border-right: 0">Text</p>'
    );

    expect(Object.keys(bordersOf(parsed.paragraphs[0])).sort()).toEqual(['bottom', 'top']);
  });

  test.each(['none', 'hidden', '0', '0px solid #000000', '1px #000000'])(
    'emits no border for "%s"',
    async (value) => {
      const parsed = await convert(`<p style="border-bottom: ${value}">Text</p>`);

      expect(pBdrOf(parsed.paragraphs[0])).toBeNull();
    }
  );

  test.each([
    ['0.25px solid #000000', '2'],
    ['20px solid #000000', '96'],
    ['thin solid #000000', '6'],
    ['medium solid #000000', '18'],
    ['thick solid #000000', '30'],
    ['solid #000000', '18'],
  ])('converts and clamps width in "%s" to w:sz=%s', async (value, sz) => {
    const parsed = await convert(`<p style="border-top: ${value}">Text</p>`);

    expect(bordersOf(parsed.paragraphs[0]).top.sz).toBe(sz);
  });

  test.each([
    ['red', 'FF0000'],
    ['rgb(0, 128, 255)', '0080FF'],
    ['#abc', 'AABBCC'],
  ])('converts border color %s to %s', async (color, hex) => {
    const parsed = await convert(`<p style="border-top: 1px solid ${color}">Text</p>`);

    expect(bordersOf(parsed.paragraphs[0]).top.color).toBe(hex);
  });

  test('uses w:color="auto" when the border has no color', async () => {
    const parsed = await convert('<p style="border-top: 1px solid">Text</p>');

    expect(bordersOf(parsed.paragraphs[0]).top.color).toBe('auto');
  });

  test('maps borders on headings and keeps the heading style', async () => {
    const parsed = await convert('<h2 style="border-bottom: 2px solid #cccccc">Title</h2>');
    const [paragraph] = parsed.paragraphs;

    expect(paragraph.xml).toContain('<w:pStyle w:val="Heading2"/>');
    expect(bordersOf(paragraph)).toEqual({ bottom: border('single', '12', 'CCCCCC') });
  });

  test('maps borders declared on list items', async () => {
    const parsed = await convert('<ul><li style="border-left: 3px solid #00aa00">Item</li></ul>');
    const [paragraph] = parsed.paragraphs;

    expect(paragraph.xml).toContain('<w:numPr>');
    expect(bordersOf(paragraph)).toEqual({ left: border('single', '18', '00AA00') });
  });

  test('does not copy a <ul> border onto its items', async () => {
    const parsed = await convert(
      '<ul style="border: 1px solid #000000"><li>One</li><li><p>Two</p></li></ul>'
    );

    assertParagraphCount(parsed, 2);
    parsed.paragraphs.forEach((paragraph) => expect(pBdrOf(paragraph)).toBeNull());
  });

  test('ignores borders on inline elements', async () => {
    const parsed = await convert('<p><span style="border: 1px solid #000000">Inline</span></p>');

    expect(pBdrOf(parsed.paragraphs[0])).toBeNull();
  });

  test('does not turn a table cell border into paragraph borders', async () => {
    const parsed = await convert(
      '<table><tr><td style="border: 1px solid #ff0000"><p>Cell</p></td></tr></table>'
    );
    const paragraph = parsed.paragraphs.find((p) => p.text === 'Cell');

    expect(pBdrOf(paragraph)).toBeNull();
  });
});

describe('Paragraph borders backward compatibility', () => {
  const shadedBorder = { val: 'single', sz: '0', space: '3', color: 'FFFFFF' };

  test('a shaded block paragraph keeps its existing white padding borders', async () => {
    const parsed = await convert('<p style="display: block; background-color: #eeeeee">Shaded</p>');

    expect(bordersOf(parsed.paragraphs[0])).toEqual({
      top: shadedBorder,
      left: shadedBorder,
      bottom: shadedBorder,
      right: shadedBorder,
    });
    expect(parsed.paragraphs[0].xml).toContain('<w:shd w:val="clear" w:fill="eeeeee"/>');
  });

  test('a CSS border on a shaded block paragraph replaces only that side', async () => {
    const parsed = await convert(
      '<p style="display: block; background-color: #eeeeee; border-bottom: 1px solid #000000">Shaded</p>'
    );

    expect(bordersOf(parsed.paragraphs[0])).toEqual({
      top: shadedBorder,
      left: shadedBorder,
      bottom: border('single', '6', '000000'),
      right: shadedBorder,
    });
  });

  test('a paragraph without borders has no <w:pBdr>', async () => {
    const parsed = await convert('<p style="color: red">Text</p>');

    expect(pBdrOf(parsed.paragraphs[0])).toBeNull();
  });
});
