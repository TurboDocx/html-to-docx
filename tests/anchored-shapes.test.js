/**
 * Behind-Text Shape Tests
 *
 * <span data-shape="rect"> and <span data-shape="line"> become a page-anchored
 * DrawingML shape that paints behind the text and takes no space in the line.
 * The markers are empty elements, so these tests also guard the path that
 * keeps them alive through the minifier and the run builder.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-validator.js';
import { renderParts, assertWellFormedXML, indexOfElement } from './helpers/docx-parts.js';

const WPS_URI = 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape';

const RECT_MARKER =
  '<span data-shape="rect" data-left="0" data-top="0" data-width="816" data-height="96"' +
  ' data-fill="#EEF2FF"></span>';
const LINE_MARKER =
  '<span data-shape="line" data-left="96" data-top="95" data-width="624"' +
  ' data-stroke="#DEE2E6" data-stroke-width="2" data-stroke-style="dashed"></span>';

/** Pull every anchor element out of a part, prefixed or not. */
function findAnchors(xml) {
  return [...xml.matchAll(/<(?:wp:)?anchor\b[\s\S]*?<\/(?:wp:)?anchor>/g)].map((m) => m[0]);
}

/** Read one attribute off an element's opening tag. */
function attributeOf(xml, elementPattern, attributeName) {
  const element = xml.match(new RegExp(`<${elementPattern}\\b[^>]*>`));
  if (!element) return null;
  const attribute = element[0].match(new RegExp(`${attributeName}="([^"]*)"`));

  return attribute ? attribute[1] : null;
}

async function convertBody(html) {
  const buffer = await HTMLtoDOCX(html, null, {}, null);
  const parsed = await parseDOCX(buffer);
  assertWellFormedXML(parsed.xml, 'document.xml');

  return parsed.xml;
}

describe('behind-text shapes', () => {
  describe('rectangle', () => {
    it('should emit one page-anchored drawing behind the text', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}text</p>`);
      const anchors = findAnchors(xml);
      expect(anchors).toHaveLength(1);
      const anchor = anchors[0];
      expect(attributeOf(anchor, 'wp:anchor', 'behindDoc')).toBe('1');
      expect(attributeOf(anchor, 'wp:anchor', 'simplePos')).toBe('0');
      expect(attributeOf(anchor, 'wp:anchor', 'locked')).toBe('0');
      expect(attributeOf(anchor, 'wp:anchor', 'layoutInCell')).toBe('1');
      expect(attributeOf(anchor, 'wp:anchor', 'allowOverlap')).toBe('1');
      ['distT', 'distB', 'distL', 'distR'].forEach((distance) => {
        expect(attributeOf(anchor, 'wp:anchor', distance)).toBe('0');
      });
      expect(anchor).toContain('<wp:wrapNone/>');
      expect(anchor).toContain('<wp:cNvGraphicFramePr/>');
    });

    it('should position against the page in EMU', async () => {
      const xml = await convertBody(
        '<p><span data-shape="rect" data-left="10" data-top="20" data-width="30"' +
          ' data-height="40" data-fill="#123456"></span></p>'
      );
      const anchor = findAnchors(xml)[0];
      expect(anchor).toContain('<wp:positionH relativeFrom="page">');
      expect(anchor).toContain('<wp:positionV relativeFrom="page">');
      // 1px = 9525 EMU
      const offsets = [...anchor.matchAll(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/g)].map((m) =>
        Number(m[1])
      );
      expect(offsets).toEqual([95250, 190500]);
      expect(attributeOf(anchor, 'wp:extent', 'cx')).toBe('285750');
      expect(attributeOf(anchor, 'wp:extent', 'cy')).toBe('381000');
    });

    it('should build a filled rect with no outline', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}</p>`);
      const anchor = findAnchors(xml)[0];
      expect(anchor).toContain(`<a:graphicData uri="${WPS_URI}">`);
      expect(anchor).toContain('prst="rect"');
      expect(anchor).toContain('<a:avLst/>');
      expect(anchor).toContain('<a:srgbClr val="EEF2FF"/>');
      expect(anchor).toMatch(/<a:solidFill>\s*<a:srgbClr val="EEF2FF"\/>\s*<\/a:solidFill>/);
      expect(anchor).toMatch(/<a:ln>\s*<a:noFill\/>\s*<\/a:ln>/);
      expect(anchor).toMatch(/<(?:wps:)?bodyPr\/>/);
    });

    it('should give the geometry a zero offset and the marker extent', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}</p>`);
      const anchor = findAnchors(xml)[0];
      expect(anchor).toContain('<a:off x="0" y="0"/>');
      // 816px and 96px in EMU
      expect(attributeOf(anchor, 'a:ext', 'cx')).toBe('7772400');
      expect(attributeOf(anchor, 'a:ext', 'cy')).toBe('914400');
    });
  });

  describe('line', () => {
    it('should build a stroked line with no extent height', async () => {
      const xml = await convertBody(`<p>${LINE_MARKER}</p>`);
      const anchor = findAnchors(xml)[0];
      expect(anchor).toContain('prst="line"');
      expect(attributeOf(anchor, 'wp:extent', 'cy')).toBe('0');
      // 624px in EMU
      expect(attributeOf(anchor, 'wp:extent', 'cx')).toBe('5943600');
      // 2px stroke in EMU
      expect(attributeOf(anchor, 'a:ln', 'w')).toBe('19050');
      expect(anchor).toContain('<a:srgbClr val="DEE2E6"/>');
      // A line has no interior: <a:prstGeom> is followed straight by <a:ln>,
      // with no shape-level fill in between.
      expect(anchor).toMatch(/<\/a:prstGeom>\s*<a:ln\b/);
    });

    it('should place the anchor at the line centre y', async () => {
      const xml = await convertBody(`<p>${LINE_MARKER}</p>`);
      const anchor = findAnchors(xml)[0];
      const offsets = [...anchor.matchAll(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/g)].map((m) =>
        Number(m[1])
      );
      // A zero-height box, so its top edge is its centre: 95px in EMU.
      expect(offsets[1]).toBe(904875);
    });

    it.each([
      ['solid', 'solid'],
      ['dashed', 'dash'],
      ['dotted', 'sysDot'],
      ['groove', 'solid'],
      [undefined, 'solid'],
    ])('should map data-stroke-style="%s" to prstDash "%s"', async (style, expected) => {
      const styleAttribute = style === undefined ? '' : ` data-stroke-style="${style}"`;
      const xml = await convertBody(
        '<p><span data-shape="line" data-left="0" data-top="10" data-width="100"' +
          ` data-stroke="#000000"${styleAttribute}></span></p>`
      );
      expect(findAnchors(xml)[0]).toContain(`<a:prstDash val="${expected}"/>`);
    });

    it('should default the stroke width to one pixel', async () => {
      const xml = await convertBody(
        '<p><span data-shape="line" data-left="0" data-top="10" data-width="100"' +
          ' data-stroke="#000000"></span></p>'
      );
      expect(attributeOf(findAnchors(xml)[0], 'a:ln', 'w')).toBe('9525');
    });
  });

  describe('colours', () => {
    it('should accept a three-digit hex', async () => {
      const xml = await convertBody(
        '<p><span data-shape="rect" data-left="0" data-top="0" data-width="10"' +
          ' data-height="10" data-fill="#f00"></span></p>'
      );
      expect(findAnchors(xml)[0]).toContain('<a:srgbClr val="FF0000"/>');
    });

    it('should upper-case a six-digit hex', async () => {
      const xml = await convertBody(
        '<p><span data-shape="rect" data-left="0" data-top="0" data-width="10"' +
          ' data-height="10" data-fill="#aabbcc"></span></p>'
      );
      expect(findAnchors(xml)[0]).toContain('<a:srgbClr val="AABBCC"/>');
    });
  });

  describe('invalid markers', () => {
    it.each([
      [
        'an unknown shape',
        '<span data-shape="circle" data-left="0" data-top="0" data-width="10"></span>',
      ],
      [
        'a missing left',
        '<span data-shape="rect" data-top="0" data-width="10" data-height="10" data-fill="#fff"></span>',
      ],
      [
        'a missing top',
        '<span data-shape="rect" data-left="0" data-width="10" data-height="10" data-fill="#fff"></span>',
      ],
      [
        'a missing width',
        '<span data-shape="rect" data-left="0" data-top="0" data-height="10" data-fill="#fff"></span>',
      ],
      [
        'a zero width',
        '<span data-shape="rect" data-left="0" data-top="0" data-width="0" data-height="10" data-fill="#fff"></span>',
      ],
      [
        'a missing height',
        '<span data-shape="rect" data-left="0" data-top="0" data-width="10" data-fill="#fff"></span>',
      ],
      [
        'a missing fill',
        '<span data-shape="rect" data-left="0" data-top="0" data-width="10" data-height="10"></span>',
      ],
      [
        'a malformed colour',
        '<span data-shape="rect" data-left="0" data-top="0" data-width="10" data-height="10" data-fill="rebeccapurple"></span>',
      ],
      [
        'a non-numeric length',
        '<span data-shape="rect" data-left="ten" data-top="0" data-width="10" data-height="10" data-fill="#fff"></span>',
      ],
      [
        'a missing stroke on a line',
        '<span data-shape="line" data-left="0" data-top="0" data-width="10"></span>',
      ],
    ])('should emit nothing for %s', async (_label, marker) => {
      const xml = await convertBody(`<p>${marker}after</p>`);
      expect(findAnchors(xml)).toHaveLength(0);
      expect(xml).not.toContain('wordprocessingShape');
      // The rest of the paragraph still renders.
      expect(xml).toContain('<w:t xml:space="preserve">after</w:t>');
    });

    it('should not throw on a marker with every attribute broken', async () => {
      await expect(
        convertBody('<p><span data-shape="" data-left="" data-top="" data-width=""></span></p>')
      ).resolves.toBeDefined();
    });
  });

  describe('marker survival and footprint', () => {
    it('should survive the minifier as an empty element', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}</p>`);
      expect(findAnchors(xml)).toHaveLength(1);
    });

    it('should add no text run to its paragraph', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}</p>`);
      const paragraph = xml.match(/<w:p>(?:(?!<\/w:p>)[\s\S])*<w:drawing>[\s\S]*?<\/w:p>/)[0];
      expect(paragraph).not.toContain('<w:t ');
      // The run holding the drawing carries no run properties either.
      expect(paragraph).not.toContain('<w:rPr');
    });

    it('should leave neighbouring text untouched', async () => {
      const xml = await convertBody(`<p>before${RECT_MARKER}after</p>`);
      expect(xml).toContain('<w:t xml:space="preserve">before</w:t>');
      expect(xml).toContain('<w:t xml:space="preserve">after</w:t>');
      expect(findAnchors(xml)).toHaveLength(1);
    });

    it('should work inside a <strong> and inside a table cell', async () => {
      const inStrong = await convertBody(`<p><strong>bold${RECT_MARKER}</strong></p>`);
      expect(findAnchors(inStrong)).toHaveLength(1);

      const inCell = await convertBody(`<table><tr><td>${RECT_MARKER}cell</td></tr></table>`);
      expect(findAnchors(inCell)).toHaveLength(1);
    });

    it('should emit no drawing when no marker is present', async () => {
      const xml = await convertBody('<p>ordinary paragraph</p>');
      expect(xml).not.toContain('<w:drawing>');
      expect(xml).not.toContain('wordprocessingShape');
    });
  });

  describe('ids and z-order', () => {
    it('should give each shape a unique docPr id', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}${LINE_MARKER}${RECT_MARKER}</p>`);
      const ids = [...xml.matchAll(/<wp:docPr id="(\d+)"/g)].map((m) => m[1]);
      expect(ids).toHaveLength(3);
      expect(new Set(ids).size).toBe(3);
    });

    it('should raise relativeHeight with source order', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}</p><p>${LINE_MARKER}</p>`);
      const heights = [...xml.matchAll(/relativeHeight="(\d+)"/g)].map((m) => Number(m[1]));
      expect(heights).toHaveLength(2);
      expect(heights[1]).toBeGreaterThan(heights[0]);
    });

    it('should name each shape after its id', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}</p>`);
      const id = xml.match(/<wp:docPr id="(\d+)"/)[1];
      expect(xml).toContain(`name="Shape ${id}"`);
    });
  });

  describe('headers and footers', () => {
    it('should emit well-formed shapes in header1.xml and footer1.xml', async () => {
      const { documentXml, headerXml, footerXml } = await renderParts(HTMLtoDOCX, {
        body: `<p>${RECT_MARKER}body</p>`,
        header: `<p>${RECT_MARKER}head</p>`,
        footer: `<p>${LINE_MARKER}foot</p>`,
      });
      assertWellFormedXML(documentXml, 'document.xml');
      assertWellFormedXML(headerXml, 'header1.xml');
      assertWellFormedXML(footerXml, 'footer1.xml');
      expect(findAnchors(headerXml)).toHaveLength(1);
      expect(findAnchors(footerXml)).toHaveLength(1);
    });

    it('should bind the wps and a namespaces inside a header', async () => {
      const { headerXml } = await renderParts(HTMLtoDOCX, {
        body: '<p>body</p>',
        header: `<p>${RECT_MARKER}head</p>`,
      });
      // The header root declares neither `a` nor `wps`, so the fragment has to
      // carry its own declarations.
      expect(headerXml).toContain(WPS_URI);
      expect(headerXml).toContain('http://schemas.openxmlformats.org/drawingml/2006/main');
      expect(headerXml).not.toContain('xmlns=""');
    });

    it('should not add an image relationship for a shape', async () => {
      const { zip } = await renderParts(HTMLtoDOCX, {
        body: '<p>body</p>',
        header: `<p>${RECT_MARKER}head</p>`,
      });
      const headerRels = zip.file('word/_rels/header1.xml.rels');
      if (headerRels) {
        expect(await headerRels.async('string')).not.toContain('/image');
      }
    });
  });

  describe('anchor child element order', () => {
    it('should follow the CT_Anchor sequence', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}</p>`);
      const anchor = findAnchors(xml)[0];
      const order = [
        /<wp:simplePos\b/,
        /<wp:positionH\b/,
        /<wp:positionV\b/,
        /<wp:extent\b/,
        /<wp:effectExtent\b/,
        /<wp:wrapNone\b/,
        /<wp:docPr\b/,
        /<wp:cNvGraphicFramePr\b/,
        /<a:graphic\b/,
      ].map((pattern) => indexOfElement(anchor, pattern));
      order.forEach((index) => expect(index).toBeGreaterThanOrEqual(0));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });

    it('should follow the shape property sequence inside <wps:spPr>', async () => {
      const xml = await convertBody(`<p>${RECT_MARKER}</p>`);
      const shapeProperties = findAnchors(xml)[0].match(
        /<(?:wps:)?spPr>[\s\S]*?<\/(?:wps:)?spPr>/
      )[0];
      const order = [/<a:xfrm\b/, /<a:prstGeom\b/, /<a:solidFill\b/, /<a:ln\b/].map((pattern) =>
        indexOfElement(shapeProperties, pattern)
      );
      order.forEach((index) => expect(index).toBeGreaterThanOrEqual(0));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });
  });
});
