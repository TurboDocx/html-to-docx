/**
 * A heading in a table cell is a Word heading: <w:pStyle w:val="HeadingN"/>,
 * as one in the body is — so Word's navigation pane and table of contents list
 * it — where the document asks for it (`table.cellHeadings`, the TurboDocx
 * editor's export). A cell's paragraphs were all built plain, a <h2> in a <td>
 * as a <p>, and still are by default: rich text placed in templates keeps the
 * look it had.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const CELL_HEADINGS = { table: { cellHeadings: true } };

const convert = async (html, options = CELL_HEADINGS) =>
  parseDOCX(await HTMLtoDOCX(html, null, options));

const paragraphWith = (parsed, text) =>
  parsed.paragraphs.find((paragraph) => paragraph.text === text);

describe('Headings in table cells', () => {
  test.each([1, 2, 3, 4, 5, 6])('gives an <h%i> in a cell its heading style', async (level) => {
    const parsed = await convert(
      `<table><tr><td><h${level}>Title</h${level}></td></tr></table>`
    );

    expect(paragraphWith(parsed, 'Title').xml).toContain(`<w:pStyle w:val="Heading${level}"`);
  });

  test("keeps a cell heading's own zero margins over its style's spacing", async () => {
    const parsed = await convert(
      '<table><tr><td><h1 style="margin-top: 0px; margin-bottom: 0px">Title</h1></td></tr></table>'
    );
    const spacing = paragraphWith(parsed, 'Title').xml.match(/<w:spacing\b[^>]*\/>/);

    expect(spacing?.[0]).toContain('w:before="0"');
    expect(spacing?.[0]).toContain('w:after="0"');
  });

  test('leaves a cell heading plain where the document does not ask', async () => {
    const parsed = await convert('<table><tr><td><h2>Title</h2></td></tr></table>', {});

    expect(paragraphWith(parsed, 'Title').xml).not.toContain('<w:pStyle');
  });

  test('leaves a plain paragraph in a cell as it was', async () => {
    const parsed = await convert('<table><tr><td><p>Plain</p></td></tr></table>');

    expect(paragraphWith(parsed, 'Plain').xml).not.toContain('<w:pStyle');
  });
});
