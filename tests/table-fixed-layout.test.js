import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * A table whose columns are set — `table-layout: fixed`, with a <colgroup> —
 * keeps those columns in Word.
 *
 * Without <w:tblLayout w:type="fixed"/> and a width on every cell, Word ignores
 * the grid and re-fits the columns to their content: found 2026-10-22, a
 * three-column table with a picture in its first cell opened in Word with that
 * column taking most of the page and the two empty ones squeezed to slivers.
 * LibreOffice keeps the grid either way, so its PDF hid the difference.
 */

const EMU_PER_PX = 9525;

const documentXml = async (html) => {
  const docx = await HTMLtoDOCX(html);
  return (await JSZip.loadAsync(docx)).file('word/document.xml').async('string');
};

const gridOf = (xml) => [...xml.matchAll(/<w:gridCol w:w="([\d.]+)"/g)].map((m) => Number(m[1]));

/** Each row's cells, as their declared widths in twips. */
const cellWidthsOf = (xml) =>
  [...xml.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].map((row) =>
    [...row[0].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((cell) => {
      const width = cell[0].match(/<w:tcW w:w="([\d.]+)"/);
      return width ? Number(width[1]) : null;
    })
  );

// The engine's default page: Letter, less its 1800-twip margins = 8640 twips.
const TEXT_WIDTH = 8640;

describe('a fixed-layout table keeps its columns in Word', () => {
  it('lays the table out fixed', async () => {
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed"><tr><td>A</td><td>B</td></tr></table>'
    );

    expect(xml).toContain('<w:tblLayout w:type="fixed"/>');
  });

  it('leaves a table that does not ask for it to Word', async () => {
    const xml = await documentXml(
      '<table style="width: 100%"><tr><td>A</td><td>B</td></tr></table>'
    );

    expect(xml).not.toContain('<w:tblLayout');
  });

  it('builds its grid from its columns, and gives each cell its column', async () => {
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed">' +
        '<colgroup><col style="width: 25%"><col style="width: 75%"></colgroup>' +
        '<tr><td>A</td><td>B</td></tr></table>'
    );

    expect(gridOf(xml)).toEqual([TEXT_WIDTH / 4, (TEXT_WIDTH * 3) / 4]);
    expect(cellWidthsOf(xml)).toEqual([[TEXT_WIDTH / 4, (TEXT_WIDTH * 3) / 4]]);
  });

  it('reads a column set in pixels', async () => {
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed">' +
        '<colgroup><col style="width: 100px"><col></colgroup>' +
        '<tr><td>A</td><td>B</td></tr></table>'
    );

    // 100px is 1500 twips; the column with no width takes the rest.
    expect(gridOf(xml)).toEqual([1500, TEXT_WIDTH - 1500]);
  });

  it('gives a merged cell every column it spans, and the cells below theirs', async () => {
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed">' +
        '<colgroup><col style="width: 20%"><col style="width: 30%"><col style="width: 50%"></colgroup>' +
        '<tr><td colspan="2">AB</td><td>C</td></tr>' +
        '<tr><td>A</td><td>B</td><td>C</td></tr></table>'
    );

    expect(cellWidthsOf(xml)).toEqual([
      [TEXT_WIDTH / 2, TEXT_WIDTH / 2],
      [TEXT_WIDTH / 5, (TEXT_WIDTH * 3) / 10, TEXT_WIDTH / 2],
    ]);
  });

  it('skips the column a cell above still covers', async () => {
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed">' +
        '<colgroup><col style="width: 20%"><col style="width: 30%"><col style="width: 50%"></colgroup>' +
        '<tr><td rowspan="2">A</td><td>B</td><td>C</td></tr>' +
        '<tr><td>B</td><td>C</td></tr></table>'
    );

    const [, second] = cellWidthsOf(xml);
    // The covered cell carries the column it continues; the two real ones theirs.
    expect(second.slice(-2)).toEqual([(TEXT_WIDTH * 3) / 10, TEXT_WIDTH / 2]);
  });

  it('splits a table with no columns evenly, by its first row', async () => {
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed">' +
        '<tr><td>A</td><td>B</td><td>C</td></tr></table>'
    );

    expect(cellWidthsOf(xml)).toEqual([[TEXT_WIDTH / 3, TEXT_WIDTH / 3, TEXT_WIDTH / 3]]);
  });

  it("caps a picture to its own column's content, not an even share", async () => {
    const pixel =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const xml = await documentXml(
      '<table style="width: 100%; table-layout: fixed">' +
        '<colgroup><col style="width: 25%"><col style="width: 75%"></colgroup>' +
        `<tr><td style="padding: 0"><img src="${pixel}" width="900" height="300"></td><td>B</td></tr></table>`
    );

    const width = Number(xml.match(/<wp:extent cx="(\d+)"/)[1]) / EMU_PER_PX;
    expect(width).toBeCloseTo(TEXT_WIDTH / 4 / 15, 0);
  });
});
