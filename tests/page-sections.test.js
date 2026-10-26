import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * Pages that are not set up like the rest — a landscape page in a portrait
 * document, a page with its own margins or its own colour — are sections of
 * their own, as Word keeps them.
 *
 * The body's HTML wraps every section but the last in
 * `<div data-docx-section="i">`, and `options.sections[i]` says how that
 * section's pages are set up and what its header and footer hold. The last
 * section is the document's own options, as a document of one section always
 * was.
 */

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const LETTER = { width: 12240, height: 15840 };
const MARGINS = { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 720, footer: 720 };

const render = async (html, options, header = null, footer = null) => {
  const zip = await JSZip.loadAsync(await HTMLtoDOCX(html, header, options, footer));
  const read = (name) => (zip.file(name) ? zip.file(name).async('string') : Promise.resolve(''));
  return {
    document: await read('word/document.xml'),
    rels: await read('word/_rels/document.xml.rels'),
    parts: Object.keys(zip.files),
    read,
  };
};

const sectPrs = (xml) => [...xml.matchAll(/<w:sectPr>[\s\S]*?<\/w:sectPr>/g)].map((m) => m[0]);

const landscapeSection = {
  orientation: 'landscape',
  pageSize: LETTER,
  margins: { ...MARGINS, left: 720, right: 720 },
};

describe('a document of several sections', () => {
  it('ends each wrapped section with a break that sets its pages up', async () => {
    const { document } = await render(
      '<div data-docx-section="0"><p>Wide page</p></div><p>Tall page</p>',
      { orientation: 'portrait', pageSize: LETTER, margins: MARGINS, sections: [landscapeSection] }
    );

    const [first, last] = sectPrs(document);
    // The first section: turned, with its own margins, starting a new page.
    expect(first).toContain('<w:type w:val="nextPage"/>');
    expect(first).toMatch(/<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"\/>/);
    expect(first).toMatch(/w:left="720"/);
    // The last is the document's own.
    expect(last).toMatch(/<w:pgSz w:w="12240" w:h="15840" w:orient="portrait"/);
    // The break follows the section's own content, before the next section's.
    expect(document.indexOf('Wide page')).toBeLessThan(document.indexOf('nextPage'));
    expect(document.indexOf('nextPage')).toBeLessThan(document.indexOf('Tall page'));
  });

  it("gives every section the document's header and footer", async () => {
    const { document, rels } = await render(
      '<div data-docx-section="0"><p>One</p></div><p>Two</p>',
      {
        pageSize: LETTER,
        margins: MARGINS,
        header: true,
        footer: true,
        sections: [landscapeSection],
      },
      '<p>Header</p>',
      '<p>Footer</p>'
    );

    const [first, last] = sectPrs(document);
    const headerId = last.match(/<w:headerReference r:id="(rId\d+)"/)[1];
    const footerId = last.match(/<w:footerReference r:id="(rId\d+)"/)[1];
    expect(first).toContain(`<w:headerReference r:id="${headerId}" w:type="default"/>`);
    expect(first).toContain(`<w:footerReference r:id="${footerId}" w:type="default"/>`);
    expect(rels).toContain(headerId);
  });

  it('gives a section a header of its own when it brings one', async () => {
    const { document, parts, read } = await render(
      '<div data-docx-section="0"><p>One</p></div><p>Two</p>',
      {
        pageSize: LETTER,
        margins: MARGINS,
        header: true,
        sections: [{ ...landscapeSection, headerHTML: '<p>Wide header</p>' }],
      },
      '<p>Main header</p>'
    );

    const [first, last] = sectPrs(document);
    const firstHeader = first.match(/<w:headerReference r:id="(rId\d+)"/)[1];
    const lastHeader = last.match(/<w:headerReference r:id="(rId\d+)"/)[1];
    expect(firstHeader).not.toBe(lastHeader);
    const headerParts = parts.filter((name) => /^word\/header\d+\.xml$/.test(name));
    expect(headerParts).toHaveLength(2);
    const texts = await Promise.all(headerParts.map(read));
    expect(texts.some((xml) => xml.includes('Wide header'))).toBe(true);
    expect(texts.some((xml) => xml.includes('Main header'))).toBe(true);
  });

  it("caps a picture to its own section's text width", async () => {
    const { document } = await render(
      `<div data-docx-section="0"><p><img src="${PIXEL}" width="2000" height="100"></p></div>` +
        `<p><img src="${PIXEL}" width="2000" height="100"></p>`,
      { orientation: 'portrait', pageSize: LETTER, margins: MARGINS, sections: [landscapeSection] }
    );

    const widths = [...document.matchAll(/<wp:extent cx="(\d+)"/g)].map((m) =>
      Math.round(Number(m[1]) / 9525)
    );
    // Landscape: 15840 less 720 either side = 14400 twips = 960px. Portrait:
    // 12240 less 1440 either side = 9360 twips = 624px.
    expect(widths).toEqual([960, 624]);
  });

  it("lays a section's own header and footer out on that section's page", async () => {
    // A portrait page in a landscape document: its header's full-width table
    // came out as wide as the landscape page and ran off both sides of the
    // portrait one (2026-10-23, checked in Word).
    const fullWidthTable =
      '<table style="width: 100%; table-layout: fixed"><colgroup><col style="width: 50%"><col style="width: 50%"></colgroup>' +
      '<tr><td><p>A</p></td><td><p>B</p></td></tr></table>';
    const portraitSection = {
      orientation: 'portrait',
      pageSize: LETTER,
      margins: MARGINS,
      headerHTML: `<p>Tall header</p>${fullWidthTable}`,
      footerHTML: `<p>Tall footer</p>${fullWidthTable}`,
    };
    const { parts, read } = await render(
      '<div data-docx-section="0"><p>Tall page</p></div><p>Wide page</p>',
      {
        ...landscapeSection,
        header: true,
        footer: true,
        sections: [portraitSection],
      },
      `<p>Wide header</p>${fullWidthTable}`,
      `<p>Wide footer</p>${fullWidthTable}`
    );

    const tableWidthIn = async (text) => {
      const names = parts.filter((name) => /^word\/(header|footer)\d+\.xml$/.test(name));
      const xmls = await Promise.all(names.map(read));
      const xml = xmls.find((part) => part.includes(text));
      return Number(xml.match(/<w:tblW w:type="dxa" w:w="(\d+)"\/>/)[1]);
    };
    // Portrait: 12240 less 1440 either side. Landscape: 15840 less 720 either side.
    expect(await tableWidthIn('Tall header')).toBe(9360);
    expect(await tableWidthIn('Tall footer')).toBe(9360);
    expect(await tableWidthIn('Wide header')).toBe(14400);
    expect(await tableWidthIn('Wide footer')).toBe(14400);
  });

  it('writes a document of one section as it always did', async () => {
    const { document } = await render('<p>Only</p>', { pageSize: LETTER, margins: MARGINS });

    expect(sectPrs(document)).toHaveLength(1);
    expect(document).not.toContain('nextPage');
  });
});
