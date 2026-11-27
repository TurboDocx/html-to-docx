import JSZip from 'jszip';

import HTMLtoDOCX from '../index';

/**
 * Review fixes for the `sections` and `firstPage` options: units, one header
 * reference per type, tolerance of odd entries, and sectPr child order.
 */

/**
 * Converts and reads back the parts the tests look at.
 * @param {Object} params - The parameters.
 * @param {string} params.html - The body HTML.
 * @param {Object} params.options - The document options.
 * @param {string} [params.header] - The header HTML.
 * @param {string} [params.footer] - The footer HTML.
 * @returns {Promise<Object>} The document and relationships XML, and a part reader.
 */
const render = async ({ html, options, header = null, footer = null }) => {
  const zip = await JSZip.loadAsync(await HTMLtoDOCX(html, header, options, footer));
  return {
    document: await zip.file('word/document.xml').async('string'),
    rels: await zip.file('word/_rels/document.xml.rels').async('string'),
    read: (name) => zip.file(name).async('string'),
  };
};

const sectPrs = (xml) => [...xml.matchAll(/<w:sectPr>[\s\S]*?<\/w:sectPr>/g)].map((m) => m[0]);
const attr = ({ xml, tag, name }) =>
  (xml.match(new RegExp(`<w:${tag}[^>]*w:${name}="([^"]*)"`)) || [])[1];
const sectionHtml = '<div data-docx-section="0"><p>one</p></div><p>two</p>';

describe('section page setup units', () => {
  it('keeps a margin of 0', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: { sections: [{ margins: { top: 0 } }] },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgMar', name: 'top' })).toBe('0');
  });

  it('converts pt margins to twips', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: { sections: [{ margins: { left: '72pt' } }] },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgMar', name: 'left' })).toBe('1440');
  });

  it('converts mm page sizes to whole twips', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: { sections: [{ pageSize: { width: '210mm', height: '297mm' } }] },
    });
    const [first] = sectPrs(document);
    const width = attr({ xml: first, tag: 'pgSz', name: 'w' });
    const height = attr({ xml: first, tag: 'pgSz', name: 'h' });
    expect(width).toMatch(/^\d+$/);
    expect(height).toMatch(/^\d+$/);
    expect(Math.abs(Number(width) - 11906)).toBeLessThan(20);
    expect(Math.abs(Number(height) - 16838)).toBeLessThan(20);
    expect(document).not.toContain('NaN');
  });

  it('falls back to the document margin for an unparseable value', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: { margins: { left: 500 }, sections: [{ margins: { left: 'abc' } }] },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgMar', name: 'left' })).toBe('500');
    expect(document).not.toContain('NaN');
  });
});

describe('a first-type header together with firstPage', () => {
  const firstRefs = ({ sectPr, kind }) =>
    [...sectPr.matchAll(new RegExp(`<w:${kind}Reference [^>]*w:type="first"/>`, 'g'))].map(
      (m) => m[0]
    );
  const options = {
    header: true,
    footer: true,
    headerType: 'first',
    footerType: 'first',
    firstPage: { headerHTML: '<p>FP</p>', footerHTML: '<p>FPF</p>' },
  };

  it('writes one first header reference in the body sectPr, to the firstPage part', async () => {
    const rendered = await render({
      html: '<p>x</p>',
      options,
      header: '<p>H</p>',
      footer: '<p>F</p>',
    });
    const body = sectPrs(rendered.document).pop();
    const headers = firstRefs({ sectPr: body, kind: 'header' });
    expect(headers).toHaveLength(1);
    expect(firstRefs({ sectPr: body, kind: 'footer' })).toHaveLength(1);
    const id = headers[0].match(/r:id="(rId\d+)"/)[1];
    const target = rendered.rels.match(new RegExp(`Id="${id}"[^>]*Target="([^"]+)"`))[1];
    await expect(rendered.read(`word/${target}`)).resolves.toContain('FP');
  });

  it("writes one first header reference in section 0's break", async () => {
    const rendered = await render({
      html: sectionHtml,
      options: { ...options, sections: [{}] },
      header: '<p>H</p>',
      footer: '<p>F</p>',
    });
    const [first] = sectPrs(rendered.document);
    expect(firstRefs({ sectPr: first, kind: 'header' })).toHaveLength(1);
    expect(firstRefs({ sectPr: first, kind: 'footer' })).toHaveLength(1);
  });

  it('without firstPage a first-type header is still written', async () => {
    const { document } = await render({
      html: '<p>x</p>',
      options: { header: true, headerType: 'first' },
      header: '<p>H</p>',
    });
    const body = sectPrs(document).pop();
    expect(firstRefs({ sectPr: body, kind: 'header' })).toHaveLength(1);
  });
});
