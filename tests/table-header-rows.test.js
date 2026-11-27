import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * A table's header rows, as Word keeps them (Amit, 2026-10-23: "do it like
 * Word"). Word marks a header row `<w:trPr><w:tblHeader/></w:trPr>` — Table
 * Properties → Row → "Repeat as header row at the top of each page" — which is
 * what a table Word made itself writes, checked by having Word build one. The
 * HTML says which rows are the header the usual way: they are the <thead>.
 */

const documentXml = async (html) => {
  const docx = await HTMLtoDOCX(html, null, { browserLayout: true });
  return (await JSZip.loadAsync(docx)).file('word/document.xml').async('string');
};

const rowsOf = (xml) => [...xml.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].map((m) => m[0]);

describe("a table's header rows", () => {
  it('marks every row of the <thead> as a header row Word repeats', async () => {
    const xml = await documentXml(
      '<table><thead><tr><th>Head 1</th></tr><tr><th>Head 2</th></tr></thead>' +
        '<tbody><tr><td>Body</td></tr></tbody></table>'
    );

    const [head1, head2, body] = rowsOf(xml);
    expect(head1).toMatch(/<w:trPr>\s*<w:tblHeader\/>/);
    expect(head2).toMatch(/<w:trPr>\s*<w:tblHeader\/>/);
    expect(body).not.toContain('tblHeader');
  });

  // CT_Tbl is tblPr, then one tblGrid, then the rows. A <thead> and a <tbody> each used to build
  // the grid, so a second <w:tblGrid> landed between the rows: invalid, and Word on the web then
  // refuses to edit some documents that hold such a table.
  it('writes one <w:tblGrid>, before the rows, for a table with a <thead> and a <tbody>', async () => {
    const xml = await documentXml(
      '<table><thead><tr><th>Head</th><th>Head</th></tr></thead>' +
        '<tbody><tr><td>Body</td><td>Body</td></tr></tbody></table>'
    );

    const children = [...xml.matchAll(/<w:(tblPr|tblGrid|tr)[\s>]/g)].map((m) => m[1]);
    expect(children).toStrictEqual(['tblPr', 'tblGrid', 'tr', 'tr']);
  });

  // The same schema fix applies without browserLayout: 1.23.3's second grid is invalid for every
  // caller, as the other schema fixes that stay on for everyone are.
  it('writes one <w:tblGrid> for a <thead> table without browserLayout too', async () => {
    const docx = await HTMLtoDOCX(
      '<table><thead><tr><th>Head</th><th>Head</th></tr></thead>' +
        '<tbody><tr><td>Body</td><td>Body</td></tr></tbody></table>'
    );
    const zip = await JSZip.loadAsync(docx);
    const xml = await zip.file('word/document.xml').async('string');

    const children = [...xml.matchAll(/<w:(tblPr|tblGrid|tr)[\s>]/g)].map((m) => m[1]);
    expect(children).toStrictEqual(['tblPr', 'tblGrid', 'tr', 'tr']);
  });

  it.each(['tbody', 'thead'])(
    'writes one <w:tblGrid> when a bare <tr> comes before a <%s>',
    async (section) => {
      const docx = await HTMLtoDOCX(
        `<table><tr><td>1</td><td>2</td></tr><${section}><tr><td>3</td><td>4</td></tr></${section}></table>`
      );
      const zip = await JSZip.loadAsync(docx);
      const xml = await zip.file('word/document.xml').async('string');

      const children = [...xml.matchAll(/<w:(tblPr|tblGrid|tr)[\s>]/g)].map((m) => m[1]);
      expect(children).toStrictEqual(['tblPr', 'tblGrid', 'tr', 'tr']);
    }
  );

  it('marks no row of a table that has no <thead>', async () => {
    const xml = await documentXml('<table><tr><th>Head</th></tr><tr><td>Body</td></tr></table>');

    expect(xml).not.toContain('tblHeader');
  });
});
