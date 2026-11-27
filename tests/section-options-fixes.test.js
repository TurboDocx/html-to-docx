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

describe('an odd entry in sections', () => {
  it('treats null as an empty section using the document page setup', async () => {
    const { document } = await render({ html: sectionHtml, options: { sections: [null] } });
    const plain = await render({ html: '<p>x</p>', options: {} });
    const [first] = sectPrs(document);
    const [body] = sectPrs(plain.document);
    ['w', 'h'].forEach((name) => {
      expect(attr({ xml: first, tag: 'pgSz', name })).toBe(attr({ xml: body, tag: 'pgSz', name }));
    });
    ['top', 'left', 'header'].forEach((name) => {
      expect(attr({ xml: first, tag: 'pgMar', name })).toBe(
        attr({ xml: body, tag: 'pgMar', name })
      );
    });
  });
});

describe('titlePg order with lineNumber', () => {
  it('puts lnNumType before titlePg in the body sectPr', async () => {
    const { document } = await render({
      html: '<p>x</p>',
      options: { footer: true, lineNumber: true, firstPage: { footerHTML: '<p>first</p>' } },
      footer: '<p>F</p>',
    });
    const body = sectPrs(document).pop();
    expect(body.indexOf('<w:lnNumType')).toBeGreaterThan(-1);
    expect(body.indexOf('<w:lnNumType')).toBeLessThan(body.indexOf('<w:titlePg'));
  });
});

describe('firstPage without a written section 0 break', () => {
  const options = {
    header: true,
    firstPage: { headerHTML: '<p>FP</p>' },
    skipFirstHeaderFooter: true,
    sections: [{ orientation: 'landscape' }],
  };
  const count = ({ xml, re }) => (xml.match(re) || []).length;
  const firstRefs = /<w:headerReference [^>]*w:type="first"/g;

  it('falls back to the body sectPr when no section 0 div exists', async () => {
    const { document } = await render({
      html: '<p>x</p><p>last</p>',
      options,
      header: '<p>H</p>',
    });
    const body = sectPrs(document).pop();
    expect(count({ xml: body, re: firstRefs })).toBe(1);
    expect(count({ xml: body, re: /<w:titlePg\/>/g })).toBe(1);
  });

  it('falls back to the body sectPr when the section 0 div is inside a table cell', async () => {
    const { document } = await render({
      html: '<table><tr><td><div data-docx-section="0"><p>a</p></div></td></tr></table><p>last</p>',
      options,
      header: '<p>H</p>',
    });
    const all = sectPrs(document);
    const written = all.filter((sectPr) => sectPr.includes('w:type="first"'));
    expect(written).toHaveLength(1);
    expect(count({ xml: document, re: /<w:titlePg\/>/g })).toBe(1);
  });

  it('writes first-page references and titlePg once for a repeated index 0', async () => {
    const { document } = await render({
      html: '<div data-docx-section="0"><p>a</p></div><div data-docx-section="0"><p>b</p></div><p>last</p>',
      options,
      header: '<p>H</p>',
    });
    expect(count({ xml: document, re: firstRefs })).toBe(1);
    expect(count({ xml: document, re: /<w:titlePg\/>/g })).toBe(1);
  });
});

describe('section pageSize and orientation inherit the document', () => {
  it('takes the missing side of a partial section pageSize from the document', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: {
        pageSize: { width: 11906, height: 16838 },
        sections: [{ pageSize: { width: 11906 } }],
      },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgSz', name: 'w' })).toBe('11906');
    expect(attr({ xml: first, tag: 'pgSz', name: 'h' })).toBe('16838');
  });

  it('inherits the whole page size when the section values are all dropped', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: {
        pageSize: { width: 11906, height: 16838 },
        sections: [{ pageSize: { width: 'wide' } }],
      },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgSz', name: 'w' })).toBe('11906');
    expect(attr({ xml: first, tag: 'pgSz', name: 'h' })).toBe('16838');
  });

  it('keeps a landscape document landscape in a section without an orientation', async () => {
    const { document } = await render({
      html: '<div data-docx-section="0"><p>s0</p></div><p>last</p>',
      options: { orientation: 'landscape', header: true, sections: [{ headerHTML: '<p>S0H</p>' }] },
      header: '<p>H</p>',
    });
    const [first, body] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgSz', name: 'orient' })).toBe('landscape');
    expect(attr({ xml: first, tag: 'pgSz', name: 'w' })).toBe(
      attr({ xml: body, tag: 'pgSz', name: 'w' })
    );
    expect(attr({ xml: first, tag: 'pgSz', name: 'h' })).toBe(
      attr({ xml: body, tag: 'pgSz', name: 'h' })
    );
  });
});

describe('section margins that cannot be negative', () => {
  it('drops a negative unsigned margin and keeps a negative top', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: { margins: { left: 1000 }, sections: [{ margins: { left: -100, top: -100 } }] },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgMar', name: 'left' })).toBe('1000');
    expect(attr({ xml: first, tag: 'pgMar', name: 'top' })).toBe('-100');
  });

  it('drops negative unsigned margins given as strings', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: {
        margins: { right: 900, header: 500 },
        sections: [{ margins: { right: '-10pt', header: '-1in', footer: -5, gutter: -5 } }],
      },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgMar', name: 'right' })).toBe('900');
    expect(attr({ xml: first, tag: 'pgMar', name: 'header' })).toBe('500');
    expect(attr({ xml: first, tag: 'pgMar', name: 'footer' })).not.toMatch(/^-/);
    expect(attr({ xml: first, tag: 'pgMar', name: 'gutter' })).not.toMatch(/^-/);
  });
});

describe('section pageSize that is not positive', () => {
  it('drops a negative width so the document width applies', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: {
        pageSize: { width: 11906, height: 16838 },
        sections: [{ pageSize: { width: -5000 } }],
      },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgSz', name: 'w' })).toBe('11906');
  });

  it('drops a zero width so the document width, not Letter, applies', async () => {
    const { document } = await render({
      html: sectionHtml,
      options: {
        pageSize: { width: 11906, height: 16838 },
        sections: [{ pageSize: { width: 0, height: '-1in' } }],
      },
    });
    const [first] = sectPrs(document);
    expect(attr({ xml: first, tag: 'pgSz', name: 'w' })).toBe('11906');
    expect(attr({ xml: first, tag: 'pgSz', name: 'h' })).toBe('16838');
  });
});
