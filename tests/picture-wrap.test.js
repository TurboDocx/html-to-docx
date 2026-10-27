import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * A picture against its text (canvas task 4.8, the document editor's wrap):
 * the editor names it on the <img> — `data-wrap` left, right, behind or front,
 * `data-wrap-gap` px from its text, `data-position` text or page with
 * `data-x` / `data-y` px — and Word gets a real anchored picture: Square for a
 * wrap, Behind Text and In Front of Text with their position, still editable
 * in Word. `data-transparency` is the picture's own transparency, in line too.
 * A picture naming none of it is written in line exactly as before, because
 * rich text variable values go through this converter as well.
 */

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const EMU_PER_PX = 9525;

const documentXml = async (html) =>
  (await JSZip.loadAsync(await HTMLtoDOCX(html))).file('word/document.xml').async('string');

const anchorOf = (xml) => (xml.match(/<wp:anchor[\s\S]*?<\/wp:anchor>/) || [''])[0];

describe('a picture against its text', () => {
  it('writes a picture in line exactly as before', async () => {
    const xml = await documentXml(`<p>Our <img src="${PIXEL}" width="40" height="20"> logo</p>`);

    expect(xml).toContain('<wp:inline');
    expect(xml).not.toContain('<wp:anchor');
    expect(xml).not.toContain('alphaModFix');
  });

  it('wraps the text round a picture on the left, its distance on the text side and below', async () => {
    const anchor = anchorOf(
      await documentXml(
        `<p><img src="${PIXEL}" width="80" height="40" data-wrap="left" data-wrap-gap="12">Text beside it</p>`
      )
    );

    expect(anchor).toMatch(
      /<wp:positionH relativeFrom="column">\s*<wp:align>left<\/wp:align>\s*<\/wp:positionH>/
    );
    expect(anchor).toMatch(
      /<wp:positionV relativeFrom="line">\s*<wp:posOffset>0<\/wp:posOffset>\s*<\/wp:positionV>/
    );
    expect(anchor).toMatch(/<wp:wrapSquare wrapText="bothSides"/);
    expect(anchor).toContain(`distR="${12 * EMU_PER_PX}"`);
    expect(anchor).toContain(`distB="${12 * EMU_PER_PX}"`);
    expect(anchor).toContain('distL="0"');
    expect(anchor).toContain('behindDoc="0"');
  });

  it('wraps on the right, the distance on its left', async () => {
    const anchor = anchorOf(
      await documentXml(
        `<p><img src="${PIXEL}" width="80" height="40" data-wrap="right" data-wrap-gap="20">Text</p>`
      )
    );

    expect(anchor).toMatch(/<wp:align>right<\/wp:align>/);
    expect(anchor).toContain(`distL="${20 * EMU_PER_PX}"`);
    expect(anchor).toContain('distR="0"');
  });

  it('puts a picture behind the text, moving with its line, at its offsets', async () => {
    const anchor = anchorOf(
      await documentXml(
        `<p>Signed <img src="${PIXEL}" width="120" height="40" data-wrap="behind" data-position="text" data-x="30" data-y="-6"></p>`
      )
    );

    expect(anchor).toContain('behindDoc="1"');
    expect(anchor).toContain('<wp:wrapNone/>');
    expect(anchor).toMatch(
      new RegExp(
        `<wp:positionH relativeFrom="column">\\s*<wp:posOffset>${30 * EMU_PER_PX}</wp:posOffset>`
      )
    );
    expect(anchor).toMatch(
      new RegExp(
        `<wp:positionV relativeFrom="line">\\s*<wp:posOffset>${-6 * EMU_PER_PX}</wp:posOffset>`
      )
    );
    expect(anchor).toContain('allowOverlap="1"');
  });

  it('fixes one in front of the text at its spot on the page', async () => {
    const anchor = anchorOf(
      await documentXml(
        `<p>Total <img src="${PIXEL}" width="60" height="60" data-wrap="front" data-position="page" data-x="500" data-y="300"></p>`
      )
    );

    expect(anchor).toContain('behindDoc="0"');
    expect(anchor).toMatch(
      /<wp:positionH relativeFrom="page">\s*<wp:posOffset>4762500<\/wp:posOffset>/
    );
    expect(anchor).toMatch(
      /<wp:positionV relativeFrom="page">\s*<wp:posOffset>2857500<\/wp:posOffset>/
    );
  });

  it('gives each anchored picture its own place in the stack', async () => {
    const xml = await documentXml(
      `<p><img src="${PIXEL}" width="10" height="10" data-wrap="front" data-position="text" data-x="0" data-y="0"><img src="${PIXEL}" width="10" height="10" data-wrap="behind" data-position="text" data-x="0" data-y="0"></p>`
    );

    const heights = [...xml.matchAll(/relativeHeight="(\d+)"/g)].map((m) => m[1]);
    expect(heights).toHaveLength(2);
    expect(new Set(heights).size).toBe(2);
  });

  it("fades a picture by its transparency, the picture's own in Word", async () => {
    const xml = await documentXml(
      `<p><img src="${PIXEL}" width="40" height="20" data-transparency="85"></p>`
    );

    expect(xml).toContain('<wp:inline');
    expect(xml).toMatch(/<a:blip [^>]*>\s*<a:alphaModFix amt="15000"\/>/);
  });
});
