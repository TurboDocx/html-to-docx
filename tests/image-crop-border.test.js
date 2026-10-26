import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * A picture's crop and border, as Word's Format Picture sets them (Amit,
 * 2026-10-23).
 *
 * The editor crops a picture rather than the file: the HTML names how much is
 * cut off each side, as a fraction, in `data-crop-top|right|bottom|left`, and
 * Word draws only what is left (<a:srcRect>, in thousandths of a percent).
 * Its border is `data-border-width` (px) and `data-border-color`, a line
 * around the picture (<a:ln>).
 */

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const documentXml = async (html) =>
  (await JSZip.loadAsync(await HTMLtoDOCX(html))).file('word/document.xml').async('string');

describe("a picture's crop and border", () => {
  it('cuts off what the crop names, each side its own', async () => {
    const xml = await documentXml(
      `<p><img src="${PIXEL}" width="100" height="50" data-crop-top="0.1" data-crop-right="0.25" data-crop-bottom="0" data-crop-left="0.05"></p>`
    );

    expect(xml).toMatch(/<a:srcRect b="0" l="5000" r="25000" t="10000"\/>/);
  });

  it('crops nothing when the picture names no crop', async () => {
    const xml = await documentXml(`<p><img src="${PIXEL}" width="100" height="50"></p>`);

    expect(xml).toMatch(/<a:srcRect b="0" l="0" r="0" t="0"\/>/);
  });

  it('ignores a crop that is not a fraction of the picture', async () => {
    const xml = await documentXml(
      `<p><img src="${PIXEL}" width="100" height="50" data-crop-left="2" data-crop-top="-1"></p>`
    );

    expect(xml).toMatch(/<a:srcRect b="0" l="0" r="0" t="0"\/>/);
  });

  it('draws a border around the picture', async () => {
    const xml = await documentXml(
      `<p><img src="${PIXEL}" width="100" height="50" data-border-width="2" data-border-color="#1F4E79"></p>`
    );

    // 2px is 19050 EMU.
    expect(xml).toMatch(
      /<a:ln w="19050">\s*<a:solidFill>\s*<a:srgbClr val="1F4E79"\/>\s*<\/a:solidFill>\s*<\/a:ln>/
    );
  });

  it("keeps the picture its size and leaves room for its border outside it, as Word does", async () => {
    // Word paints a picture's line OUTSIDE the picture and says how far it
    // reaches in <wp:effectExtent>: a picture Word made itself, 150x75pt with
    // a 6pt line, came out extent 150x75pt and effectExtent 6pt every side,
    // and painted 162pt wide (2026-10-23).
    const xml = await documentXml(
      `<p><img src="${PIXEL}" width="100" height="50" data-border-width="3" data-border-color="#666666"></p>`
    );

    const [, cx, cy] = xml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/);
    expect(Number(cx) / 9525).toBe(100);
    expect(Number(cy) / 9525).toBe(50);
    // 3px is 28575 EMU.
    expect(xml).toMatch(/<wp:effectExtent l="28575" t="28575" r="28575" b="28575"\/>/);
  });

  it('holds a bordered picture and its border together to the line', async () => {
    // The engine's page leaves a 576px line. A picture asked to be wider is
    // held to it — less its border both sides, which Word lays out too.
    const xml = await documentXml(
      `<p><img src="${PIXEL}" width="2000" height="100" data-border-width="10" data-border-color="#666666"></p>`
    );

    const [, cx] = xml.match(/<wp:extent cx="(\d+)"/);
    expect(Math.round(Number(cx) / 9525)).toBe(576 - 20);
  });

  it('reaches no further than the picture without a border', async () => {
    const xml = await documentXml(`<p><img src="${PIXEL}" width="100" height="50"></p>`);

    expect(xml).toMatch(/<wp:effectExtent b="0" l="0" r="0" t="0"\/>|<wp:effectExtent l="0" t="0" r="0" b="0"\/>/);
  });

  it('draws no border for a picture without one', async () => {
    const xml = await documentXml(`<p><img src="${PIXEL}" width="100" height="50"></p>`);

    expect(xml).not.toContain('<a:ln');
  });

  it('keeps the size it was given, stretched as the author left it', async () => {
    const xml = await documentXml(`<p><img src="${PIXEL}" width="200" height="40"></p>`);

    const [, cx, cy] = xml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/);
    expect(Number(cx) / 9525).toBe(200);
    expect(Number(cy) / 9525).toBe(40);
  });

  it("gives Word the picture's alt text, where its Alt Text pane reads it", async () => {
    // Word reads a picture's alt text off the drawing (<wp:docPr descr>), not
    // the picture inside it — with only the latter, Word showed none
    // (2026-10-23, checked through Word itself).
    const xml = await documentXml(`<p><img src="${PIXEL}" width="100" height="50" alt="Samurai portrait"></p>`);

    expect(xml).toMatch(/<wp:docPr id="\d+" name="[^"]+" descr="Samurai portrait"\/>/);
  });
});
