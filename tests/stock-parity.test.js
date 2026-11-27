import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * Without `browserLayout`, the converter lays things out as stock html-to-docx
 * does: callers that never heard of the document editor keep the output they
 * had. The tcPr/nested-table validity fixes apply to everyone.
 */

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const EMU_PER_PX = 9525;

const documentXml = async (html, options) => {
  const docx = await HTMLtoDOCX(html, undefined, options);
  return (await JSZip.loadAsync(docx)).file('word/document.xml').async('string');
};

describe('stock output when browserLayout is not set', () => {
  it('keeps a 450x225 picture in a table cell at 450x225', async () => {
    const xml = await documentXml(
      `<table><tr><td><img src="${PIXEL}" width="450" height="225"></td><td>B</td></tr></table>`
    );
    const [, cx, cy] = xml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/);

    expect([Number(cx) / EMU_PER_PX, Number(cy) / EMU_PER_PX]).toEqual([450, 225]);
  });

  it('draws a 1px border as 1pt (w:sz 8)', async () => {
    const xml = await documentXml(
      '<table><tr><td style="border: 1px solid #000000">A</td></tr></table>'
    );
    const sizes = [...xml.matchAll(/<w:(?:top|left|bottom|right)\b[^>]*w:sz="(\d+)"/g)].map(
      (match) => Number(match[1])
    );

    expect(sizes.length).toBeGreaterThan(0);
    expect(new Set(sizes)).toEqual(new Set([8]));
  });

  it('draws a 1px border at its exact 6 eighths with browserLayout', async () => {
    const xml = await documentXml(
      '<table><tr><td style="border: 1px solid #000000">A</td></tr></table>',
      { browserLayout: true }
    );

    expect(xml).toContain('w:sz="6"');
    expect(xml).not.toContain('w:sz="8"');
  });
});

describe('a fixed table cell width', () => {
  const fixedTable =
    '<table style="width: 100%; table-layout: fixed"><tr><td>A</td><td>B</td></tr></table>';

  it('is not declared by default', async () => {
    expect(await documentXml(fixedTable)).not.toContain('<w:tcW');
  });

  it('is declared with browserLayout', async () => {
    expect(await documentXml(fixedTable, { browserLayout: true })).toContain('<w:tcW');
  });
});

describe.each([[undefined], [{ browserLayout: true }]])('validity fixes, options %j', (options) => {
  it('puts a cell width before its grid span in a fixed table', async () => {
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed"><tr><td colspan="2" style="width: 200px">A</td></tr><tr><td>B</td><td>C</td></tr></table>',
      options
    );
    const spanningCell = xml.match(
      /<w:tc>(?:(?!<\/w:tc>)[\s\S])*?<w:gridSpan[\s\S]*?<\/w:tcPr>/
    )[0];

    expect(spanningCell.indexOf('<w:tcW')).toBeGreaterThan(-1);
    expect(spanningCell.indexOf('<w:tcW')).toBeLessThan(spanningCell.indexOf('<w:gridSpan'));
  });

  it('does not make a nested table fixed because its parent is', async () => {
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed"><tr><td><table><tr><td>in</td></tr></table></td></tr></table>',
      options
    );

    expect(xml.match(/<w:tblLayout w:type="fixed"\/>/g)).toHaveLength(1);
  });
});
