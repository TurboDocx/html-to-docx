/**
 * font-style on a span: italic in Word, as a browser draws it.
 *
 * The document editor writes a header or footer's band-wide Italic, and a text
 * style's italic, as `font-style: italic` on the span that sets the type. Only
 * <em> and <i> made a run italic, so both came out upright in the Word file
 * and the PDF while the editor drew them italic (2026-10-29, the editor's full
 * feature test).
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const convert = async (html, options = {}) => {
  const docx = await HTMLtoDOCX(html, null, options);
  return parseDOCX(docx);
};

const compact = (xml) => xml.replace(/>\n\s*</g, '><');

const runWithText = (parsed, text) => {
  const run = parsed.paragraphs
    .flatMap((paragraph) => compact(paragraph.xml).match(/<w:r>[\s\S]*?<\/w:r>/g) || [])
    .map((runXml) => ({
      rPr: (runXml.match(/<w:rPr\/>|<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0],
      text: (runXml.match(/<w:t [^>]*>([^<]*)<\/w:t>/) || [])[1],
    }))
    .find((candidate) => candidate.text === text);
  expect(run).toBeDefined();
  return run;
};

describe('font-style on a span', () => {
  test.each(['italic', 'oblique', 'oblique 10deg'])('makes the run italic for %s', async (style) => {
    const parsed = await convert(`<p>Plain <span style="font-style: ${style}">slanted</span></p>`);

    expect(runWithText(parsed, 'slanted').rPr).toContain('<w:i/>');
    expect(runWithText(parsed, 'Plain ').rPr).not.toContain('<w:i');
  });

  test('keeps the italic in its slot, after the bold and before the colour', async () => {
    const parsed = await convert(
      '<p><span style="color: #666666; font-style: italic; font-weight: bold">type</span></p>'
    );

    expect(runWithText(parsed, 'type').rPr).toMatch(/<w:b\/><w:i\/>[\s\S]*<w:color/);
  });

  test('switches an italic it is inside off for normal, as font-weight: normal does bold', async () => {
    const parsed = await convert(
      '<p><span style="font-style: italic"><span style="font-style: normal">upright</span></span></p>'
    );

    expect(runWithText(parsed, 'upright').rPr).toContain('<w:i w:val="0"/>');
  });

  test('writes nothing for a style Word has no word for', async () => {
    const parsed = await convert('<p><span style="font-style: inherit">text</span></p>');

    expect(runWithText(parsed, 'text').rPr).not.toContain('<w:i');
  });
});
