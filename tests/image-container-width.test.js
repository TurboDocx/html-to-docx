import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * An image is never wider than the box it sits in — the page's text width, or
 * the table cell holding it — nor taller than the page's text height, keeping
 * its proportions. One that fits keeps the size it was given (Amit,
 * 2026-10-22: "if the size provided is bigger we cap it, if not we take the
 * size provided").
 *
 * The engine already capped an image's natural size, but a `width` given on
 * the <img> (or in its style) replaced that capped size afterwards, so an
 * image sized by its author went past its box: found 2026-10-22, a 600px image
 * in a half-width cell rendered 600px wide and was cut off at the cell's
 * edge, and a 2000px image ran off the page. Editors always send a width.
 */

// A 1x1 PNG: its size comes from the <img>'s own width and height.
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const EMU_PER_PX = 9525;
const EMU_PER_TWIP = 635;

/** Every drawn image's size, in px, and the XML of the cells, in order. */
const render = async (html) => {
  const docx = await HTMLtoDOCX(html);
  const xml = await (await JSZip.loadAsync(docx)).file('word/document.xml').async('string');
  const sizes = [...xml.matchAll(/<wp:extent cx="(\d+)" cy="(\d+)"/g)].map((match) => ({
    width: Number(match[1]) / EMU_PER_PX,
    height: Number(match[2]) / EMU_PER_PX,
  }));
  const cells = [...xml.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((match) => match[0]);
  return { xml, sizes, cells };
};

/** A cell's width in px, as the document declares it. */
const cellWidthPx = (cellXml) => {
  const width = cellXml.match(/<w:tcW w:w="(\d+)"/);
  return width ? (Number(width[1]) * EMU_PER_TWIP) / EMU_PER_PX : null;
};

// The engine's default page: Letter, 12240 twips wide, less its 1800-twip
// margins either side (constants.portraitMargins) = 8640 twips = 576px.
const PAGE_TEXT_WIDTH_PX = 576;

// Letter's 15840 twips tall, less its 1440-twip top and bottom margins
// (constants.portraitMargins) = 12960 twips = 864px.
const PAGE_TEXT_HEIGHT_PX = 864;

describe('an image is held to the width of its box', () => {
  it('keeps an image that fits at exactly the width it was given', async () => {
    const { sizes } = await render(`<p><img src="${PIXEL}" width="120" height="40"></p>`);

    expect(sizes).toEqual([{ width: 120, height: 40 }]);
  });

  it('caps an image wider than the page to the page, keeping its proportions', async () => {
    const { sizes } = await render(`<p><img src="${PIXEL}" width="2000" height="200"></p>`);

    expect(sizes[0].width).toBeCloseTo(PAGE_TEXT_WIDTH_PX, 0);
    expect(sizes[0].height).toBeCloseTo(PAGE_TEXT_WIDTH_PX / 10, 0);
  });

  it('caps an image sized in its style the same way', async () => {
    const { sizes } = await render(
      `<p><img src="${PIXEL}" style="width: 1600px; height: 400px"></p>`
    );

    expect(sizes[0].width).toBeCloseTo(PAGE_TEXT_WIDTH_PX, 0);
    expect(sizes[0].height).toBeCloseTo(PAGE_TEXT_WIDTH_PX / 4, 0);
  });

  it.each([
    ['alone in the cell', (img) => img],
    ['in a line of the cell, after text', (img) => `<p><span>Logo </span>${img}</p>`],
    ['in a styled run of the cell', (img) => `<p><span style="font-size: 15px">${img}</span></p>`],
  ])('caps an image wider than its table cell to the cell — %s', async (_label, wrap) => {
    const img = `<img src="${PIXEL}" width="600" height="300">`;
    const { sizes, cells } = await render(
      `<table style="width: 600px"><tr>` +
        `<td style="width: 300px">${wrap(img)}</td><td style="width: 300px"><p>B</p></td>` +
        `</tr></table>`
    );

    const cellWidth = cellWidthPx(cells[0]);
    expect(cellWidth).not.toBeNull();
    expect(sizes[0].width).toBeLessThanOrEqual(cellWidth);
    expect(sizes[0].width / sizes[0].height).toBeCloseTo(2, 1);
  });

  it('leaves an image narrower than its cell as it was', async () => {
    const { sizes } = await render(
      `<table style="width: 600px"><tr>` +
        `<td style="width: 300px"><p><img src="${PIXEL}" width="80" height="20"></p></td>` +
        `<td style="width: 300px"><p>B</p></td></tr></table>`
    );

    expect(sizes).toEqual([{ width: 80, height: 20 }]);
  });

  it('caps an image taller than the page to the page, keeping its proportions', async () => {
    const { sizes } = await render(`<p><img src="${PIXEL}" width="200" height="2000"></p>`);

    expect(sizes[0].height).toBeCloseTo(PAGE_TEXT_HEIGHT_PX, 0);
    expect(sizes[0].width).toBeCloseTo(PAGE_TEXT_HEIGHT_PX / 10, 0);
  });

  it('caps an image both too wide and too tall by whichever limit binds harder', async () => {
    const { sizes } = await render(`<p><img src="${PIXEL}" width="1000" height="3000"></p>`);

    expect(sizes[0].height).toBeLessThanOrEqual(PAGE_TEXT_HEIGHT_PX + 0.5);
    expect(sizes[0].width).toBeLessThanOrEqual(PAGE_TEXT_WIDTH_PX + 0.5);
    expect(sizes[0].height / sizes[0].width).toBeCloseTo(3, 1);
  });

  it('caps a tall image among text in a line, as one alone', async () => {
    const { sizes } = await render(
      `<p><span>Chart </span><img src="${PIXEL}" width="200" height="2000"><span> below</span></p>`
    );

    expect(sizes[0].height).toBeCloseTo(PAGE_TEXT_HEIGHT_PX, 0);
  });
});

/**
 * A cell's box is its columns less its padding — what Word lays the cell's
 * content out in. The cap used to be the page split evenly between a row's
 * cells: an image in a padded cell came out wider than the cell's content
 * (found 2026-10-22: a 201px image in a 201px cell with 7px padding either
 * side), and a merged cell, or one beside a merged cell, got the wrong share.
 */
describe("an image in a table cell is held to the cell's content box", () => {
  const img = (width, height) => `<img src="${PIXEL}" width="${width}" height="${height}">`;
  const cell = (content, extra = '') => `<td style="padding: 7px"${extra}>${content}</td>`;

  it("takes the cell's padding off its width", async () => {
    const { sizes } = await render(
      `<table style="width: 100%"><tr>${cell(img(600, 300))}${cell('<p>B</p>')}</tr></table>`
    );

    // Two equal columns of the page's text width, less 7px either side.
    expect(sizes[0].width).toBeCloseTo(PAGE_TEXT_WIDTH_PX / 2 - 14, 0);
    expect(sizes[0].width / sizes[0].height).toBeCloseTo(2, 1);
  });

  it('gives a merged cell the width of every column it spans', async () => {
    const { sizes } = await render(
      `<table style="width: 100%">` +
        `<tr>${cell(img(900, 300), ' colspan="2"')}${cell('<p>C</p>')}</tr>` +
        `<tr>${cell('<p>A</p>')}${cell('<p>B</p>')}${cell('<p>C</p>')}</tr>` +
        `</table>`
    );

    expect(sizes[0].width).toBeCloseTo((PAGE_TEXT_WIDTH_PX / 3) * 2 - 14, 0);
  });

  it('gives a cell beside a merged one only its own column', async () => {
    const { sizes } = await render(
      `<table style="width: 100%">` +
        `<tr>${cell(img(900, 300))}${cell('<p>BC</p>', ' colspan="2"')}</tr>` +
        `<tr>${cell('<p>A</p>')}${cell('<p>B</p>')}${cell('<p>C</p>')}</tr>` +
        `</table>`
    );

    expect(sizes[0].width).toBeCloseTo(PAGE_TEXT_WIDTH_PX / 3 - 14, 0);
  });

  it("keeps the table's own cell margins for a cell that sets none", async () => {
    const { sizes } = await render(
      `<table style="width: 100%"><tr><td>${img(600, 300)}</td><td><p>B</p></td></tr></table>`
    );

    // The table's default cell margin is 160 twips either side, so 320 come off
    // the column's 4320.
    expect(sizes[0].width).toBeCloseTo((4320 - 320) / 15, 0);
  });
});
