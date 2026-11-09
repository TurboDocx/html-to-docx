import HTMLtoDOCX from '../index.js';
import JSZip from 'jszip';

async function getDocumentXml(htmlString) {
  const buffer = await HTMLtoDOCX(htmlString, null, {});
  const zip = await JSZip.loadAsync(buffer);
  return zip.file('word/document.xml').async('string');
}

// Returns the character index of the first occurrence of `needle` inside the
// rendered document XML (or -1). Used to assert relative ordering of rows.
function indexOf(xml, needle) {
  return xml.indexOf(needle);
}

describe('Table <tfoot> rendering', () => {
  test('renders tfoot rows that were previously dropped', async () => {
    const html = `
      <table border="1">
        <thead><tr><th>HEADCELL</th></tr></thead>
        <tbody><tr><td>BODYCELL</td></tr></tbody>
        <tfoot><tr><td>FOOTCELL</td></tr></tfoot>
      </table>
    `;
    const doc = await getDocumentXml(html);
    expect(doc).toContain('FOOTCELL');
  });

  test('thead + tfoot (no tbody) produces exactly one tblGrid before any row', async () => {
    const html = `
      <table border="1">
        <thead><tr><th>H1</th><th>H2</th></tr></thead>
        <tfoot><tr><td>F1</td><td>F2</td></tr></tfoot>
      </table>
    `;
    const doc = await getDocumentXml(html);
    const gridCount = (doc.match(/<w:tblGrid>/g) || []).length;
    expect(gridCount).toBe(1);
    // grid must precede every row
    expect(indexOf(doc, '<w:tblGrid>')).toBeLessThan(indexOf(doc, '<w:tr>'));
    expect(doc).toContain('F1');
  });

  test('rowspan in tbody does not bleed into the deferred tfoot row', async () => {
    // RS declares rowspan=3 but tbody only has 2 rows, so one span is unsatisfied.
    // A footer is a new row group: the leftover span must NOT continue into tfoot.
    const html = `
      <table border="1">
        <tbody>
          <tr><td rowspan="3">RS</td><td>b1</td></tr>
          <tr><td>b2</td></tr>
        </tbody>
        <tfoot><tr><td>f1</td></tr></tfoot>
      </table>
    `;
    const doc = await getDocumentXml(html);
    // Expected vMerge markers: 1 restart (RS) + 1 continue (b2 row). The tfoot
    // row must add none. Shared rowSpanMap would inject a 3rd into the footer.
    const vMergeCount = (doc.match(/vMerge/g) || []).length;
    expect(vMergeCount).toBe(2);
    expect(doc).toContain('f1');
  });

  test('single tfoot row after tbody takes the table bottom border, not the top', async () => {
    // Thick outer border so first/last forcing is visible in cell borders.
    const html = `
      <table style="border:6pt solid #000000;border-collapse:collapse;">
        <tbody><tr><td>b1</td></tr><tr><td>b2</td></tr><tr><td>b3</td></tr></tbody>
        <tfoot><tr><td>FOOT</td></tr></tfoot>
      </table>
    `;
    const doc = await getDocumentXml(html);
    const rows = doc.match(/<w:tr>[\s\S]*?<\/w:tr>/g) || [];
    const footRow = rows.find((r) => /FOOT/.test(r));
    const topSz = (footRow.match(/<w:top[^/]*w:sz="(\d+)"/) || [])[1] || null;
    const botSz = (footRow.match(/<w:bottom[^/]*w:sz="(\d+)"/) || [])[1] || null;
    // tfoot is the bottom of the table: bottom border forced, top NOT forced.
    expect(topSz).toBeNull();
    expect(botSz).toBe('48');
  });

  test('tfoot rendered at the bottom even when it precedes tbody in source', async () => {
    const html = `
      <table border="1">
        <tfoot><tr><td>FOOTROW</td></tr></tfoot>
        <tbody><tr><td>BODYROW</td></tr></tbody>
      </table>
    `;
    const doc = await getDocumentXml(html);
    expect(indexOf(doc, 'BODYROW')).toBeLessThan(indexOf(doc, 'FOOTROW'));
  });

  test('colspan inside tfoot produces a gridSpan', async () => {
    const html = `
      <table border="1">
        <thead><tr><th>A</th><th>B</th></tr></thead>
        <tbody><tr><td>a1</td><td>b1</td></tr></tbody>
        <tfoot><tr><td colspan="2">TOTAL</td></tr></tfoot>
      </table>
    `;
    const doc = await getDocumentXml(html);
    expect(doc).toContain('TOTAL');
    expect(doc).toMatch(/<w:gridSpan\s+w:val="2"/);
  });

  test('regression: thead + tbody table emits exactly one tblGrid', async () => {
    const html = `
      <table border="1">
        <thead><tr><th>H1</th><th>H2</th></tr></thead>
        <tbody><tr><td>a</td><td>b</td></tr></tbody>
      </table>
    `;
    const doc = await getDocumentXml(html);
    const gridCount = (doc.match(/<w:tblGrid>/g) || []).length;
    expect(gridCount).toBe(1);
  });
});
