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
  const docx = await HTMLtoDOCX(html);
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

  it('marks no row of a table that has no <thead>', async () => {
    const xml = await documentXml('<table><tr><th>Head</th></tr><tr><td>Body</td></tr></table>');

    expect(xml).not.toContain('tblHeader');
  });
});
