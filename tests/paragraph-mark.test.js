/**
 * A paragraph's mark — the pilcrow ending it — carries the paragraph's own type.
 *
 * Word lays a paragraph's last line off the tallest of the runs on it AND its
 * mark, and an empty paragraph off its mark alone. Left unset, the mark takes
 * the style's size — Heading 1's is 24pt — so a 22.5pt heading's line was laid
 * off 24pt in Word and came out taller than the editor drew it. A paragraph
 * that names its own font or size in its style writes them onto its mark.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const convert = async (html) => parseDOCX(await HTMLtoDOCX(html, null, {}));

const markOf = (paragraph) => {
  const pPr = /<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(paragraph.xml);
  const rPr = pPr && /<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(pPr[1]);
  return rPr ? rPr[1] : null;
};

describe("a paragraph's mark", () => {
  test("takes the paragraph's own size and font", async () => {
    const { paragraphs } = await convert(
      '<p style="font-family: Georgia; font-size: 30px; line-height: 1.15"><span>Big</span></p>'
    );
    const mark = markOf(paragraphs[0]);
    expect(mark).toContain('<w:sz w:val="45"/>');
    expect(mark).toMatch(/<w:rFonts [^>]*w:ascii="Georgia"/);
  });

  test("takes a heading's own size over its style's", async () => {
    const { paragraphs } = await convert(
      '<h1 style="font-size: 30px"><span>Title</span></h1>'
    );
    expect(markOf(paragraphs[0])).toContain('<w:sz w:val="45"/>');
  });

  test("is left to the style when the paragraph names no type of its own", async () => {
    const { paragraphs } = await convert(
      '<p style="line-height: 1.15"><span style="font-size: 30px">Big</span></p>'
    );
    expect(markOf(paragraphs[0])).toBeNull();
  });

  test('sits after the spacing and the alignment, as the schema orders them', async () => {
    const { paragraphs } = await convert(
      '<p style="font-size: 20px; line-height: 1.15; text-align: center">x</p>'
    );
    const pPr = /<w:pPr>([\s\S]*?)<\/w:pPr>/.exec(paragraphs[0].xml)[1];
    expect(pPr.indexOf('<w:spacing')).toBeLessThan(pPr.indexOf('<w:jc'));
    expect(pPr.indexOf('<w:jc')).toBeLessThan(pPr.indexOf('<w:rPr>'));
  });
});
