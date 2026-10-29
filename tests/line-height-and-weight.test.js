/**
 * Line height as a multiple, font-weight switching bold off, and
 * text-transform: capitalize.
 *
 * A unitless or percentage line-height is a multiple of a single line: with
 * lineRule="auto", w:line counts 240ths of a line, whatever the font size.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const convert = async (html) => parseDOCX(await HTMLtoDOCX(html, null, {}));

const lineOf = (paragraph) => {
  const match = /<w:spacing\b[^>]*w:line="(\d+)"[^>]*w:lineRule="(\w+)"/.exec(paragraph.xml);
  return match ? { line: Number(match[1]), rule: match[2] } : null;
};

describe('line-height as a multiple', () => {
  test.each([
    ['8px', 8],
    ['16px', 16],
    ['30px', 30],
  ])('a list item at %s keeps a 1.5 multiple', async (_label, size) => {
    const { paragraphs } = await convert(
      `<ul><li style="line-height: 1.5"><span style="font-size: ${size}px">Item</span></li></ul>`
    );
    expect(lineOf(paragraphs[0])).toEqual({ line: 360, rule: 'auto' });
  });

  test('a paragraph naming its own font size keeps the multiple too', async () => {
    const { paragraphs } = await convert('<p style="font-size: 30px; line-height: 2">Big</p>');
    expect(lineOf(paragraphs[0])).toEqual({ line: 480, rule: 'auto' });
  });

  test('a percentage is the same multiple, with or without a font size', async () => {
    const { paragraphs } = await convert(
      '<p style="line-height: 150%">a</p><p style="font-size: 24px; line-height: 150%">b</p>'
    );
    expect(lineOf(paragraphs[0])).toEqual({ line: 360, rule: 'auto' });
    expect(lineOf(paragraphs[1])).toEqual({ line: 360, rule: 'auto' });
  });

  test('an absolute line-height is still a minimum height', async () => {
    const { paragraphs } = await convert('<p style="line-height: 20px">a</p>');
    expect(lineOf(paragraphs[0])).toEqual({ line: 300, rule: 'atLeast' });
  });
});

describe('font-weight', () => {
  test('normal switches off the bold a heading style carries', async () => {
    const { paragraphs } = await convert(
      '<h1><span style="font-weight: normal">Light heading</span></h1>'
    );
    expect(paragraphs[0].xml).toContain('<w:b w:val="0"/>');
  });

  test('a bold run inside a heading that is not bold stays bold', async () => {
    const { paragraphs } = await convert(
      '<h2><span style="font-weight: normal">plain <strong><span style="color: #ff0000">loud</span></strong></span></h2>'
    );
    const runs = paragraphs[0].xml.match(/<w:r>.*?<\/w:r>/gs);
    expect(runs[0]).toContain('<w:b w:val="0"/>');
    expect(runs[1]).toContain('<w:b/>');
    expect(runs[1]).not.toContain('<w:b w:val="0"/>');
  });

  test('bold and numeric weights from 600 are bold', async () => {
    const { paragraphs } = await convert(
      '<p><span style="font-weight: bold">a</span><span style="font-weight: 700">b</span></p>'
    );
    expect(paragraphs[0].xml.match(/<w:b\/>/g)).toHaveLength(2);
  });

  test('a light numeric weight is not bold', async () => {
    const { paragraphs } = await convert('<p><span style="font-weight: 400">a</span></p>');
    expect(paragraphs[0].xml).not.toContain('<w:b/>');
  });

  test('plain text names no weight at all', async () => {
    const { paragraphs } = await convert('<p><span style="color: #ff0000">a</span></p>');
    expect(paragraphs[0].xml).not.toContain('<w:b');
  });
});

describe('text-transform: capitalize', () => {
  test.each([
    ["don't stop", "Don't Stop"],
    ['naïve café', 'Naïve Café'],
    ['état-major (draft)', 'État-Major (Draft)'],
  ])('%s', async (input, expected) => {
    const { paragraphs } = await convert(
      `<p><span style="text-transform: capitalize">${input}</span></p>`
    );
    expect(paragraphs[0].text).toBe(expected);
  });
});
