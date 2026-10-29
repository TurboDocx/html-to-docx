import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * Word's "Different first page": `options.firstPage` holds page 1's own
 * header and footer. They are written as the first section's `first` parts,
 * and that section — and only that one — says its first page differs
 * (`titlePg`): a section after it starts with its running bands, as the
 * document editor draws it.
 */

const LETTER = { width: 12240, height: 15840 };
const MARGINS = { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 720, footer: 720 };

const render = async (html, options, header = null, footer = null) => {
  const zip = await JSZip.loadAsync(await HTMLtoDOCX(html, header, options, footer));
  const read = (name) => (zip.file(name) ? zip.file(name).async('string') : Promise.resolve(''));
  return {
    document: await read('word/document.xml'),
    rels: await read('word/_rels/document.xml.rels'),
    contentTypes: await read('[Content_Types].xml'),
    read,
  };
};

const sectPrs = (xml) => [...xml.matchAll(/<w:sectPr>[\s\S]*?<\/w:sectPr>/g)].map((m) => m[0]);

/** The part a relationship id names, read. */
const partOf = async ({ rels, read }, id) => {
  const target = rels.match(new RegExp(`Id="${id}"[^>]*Target="([^"]+)"`))[1];
  return read(`word/${target}`);
};

const referenceOf = (sectPr, kind, type) =>
  (sectPr.match(new RegExp(`<w:${kind}Reference r:id="(rId\\d+)" w:type="${type}"/>`)) || [])[1];

describe('a different first page', () => {
  it("gives a one-section document page 1's own header and footer", async () => {
    const rendered = await render(
      '<p>Body</p>',
      {
        pageSize: LETTER,
        margins: MARGINS,
        header: true,
        footer: true,
        firstPage: { headerHTML: '<p>Cover</p>', footerHTML: '' },
      },
      '<p>Running</p>',
      '<p>Running foot</p>'
    );

    const [body] = sectPrs(rendered.document);
    expect(body).toContain('<w:titlePg/>');
    const firstHeader = referenceOf(body, 'header', 'first');
    const firstFooter = referenceOf(body, 'footer', 'first');
    expect(await partOf(rendered, firstHeader)).toContain('Cover');
    // An empty first footer is a part of its own, so page 1 shows none.
    expect(await partOf(rendered, firstFooter)).not.toContain('Running foot');
    expect(await partOf(rendered, referenceOf(body, 'header', 'default'))).toContain('Running');
    // titlePg follows the page's own setup, as the schema has it.
    expect(body.indexOf('<w:pgMar')).toBeLessThan(body.indexOf('<w:titlePg/>'));
  });

  it('gives the first section, and no other, the first page', async () => {
    const rendered = await render(
      '<div data-docx-section="0"><p>One</p></div><p>Two</p>',
      {
        pageSize: LETTER,
        margins: MARGINS,
        header: true,
        footer: true,
        sections: [{ orientation: 'landscape', pageSize: LETTER, margins: MARGINS }],
        firstPage: { headerHTML: '<p>Cover</p>', footerHTML: '<p>Cover foot</p>' },
      },
      '<p>Running</p>',
      '<p>Running foot</p>'
    );

    const [first, last] = sectPrs(rendered.document);
    expect(first).toContain('<w:titlePg/>');
    expect(first.indexOf('<w:pgMar')).toBeLessThan(first.indexOf('<w:titlePg/>'));
    expect(await partOf(rendered, referenceOf(first, 'header', 'first'))).toContain('Cover');
    expect(await partOf(rendered, referenceOf(first, 'footer', 'first'))).toContain('Cover foot');
    expect(last).not.toContain('titlePg');
    expect(last).not.toContain('w:type="first"');
  });

  it('writes nothing of the kind without it', async () => {
    const { document } = await render(
      '<p>Body</p>',
      { pageSize: LETTER, margins: MARGINS, header: true, footer: true },
      '<p>Running</p>',
      '<p>Running foot</p>'
    );

    expect(document).not.toContain('titlePg');
    expect(document).not.toContain('w:type="first"');
  });

  it("keeps a picture in the first page's header with its own part, so it is drawn", async () => {
    const PIXEL =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const rendered = await render(
      '<p>Body</p>',
      {
        pageSize: LETTER,
        margins: MARGINS,
        header: true,
        footer: true,
        firstPage: { headerHTML: `<p><img src="${PIXEL}" width="40" height="20">Cover</p>`, footerHTML: '' },
      },
      '<p>Running</p>',
      '<p>Running foot</p>'
    );

    const [body] = sectPrs(rendered.document);
    const firstHeaderId = referenceOf(body, 'header', 'first');
    const target = rendered.rels.match(new RegExp(`Id="${firstHeaderId}"[^>]*Target="([^"]+)"`))[1];
    const part = await rendered.read(`word/${target}`);
    const embed = part.match(/r:embed="([^"]+)"/)[1];
    // Its picture's relationship is in its OWN part's rels, not the running header's.
    const partRels = await rendered.read(`word/_rels/${target}.rels`);
    expect(partRels).toMatch(new RegExp(`Id="${embed}"[^>]*Target="media/`));
  });
});
