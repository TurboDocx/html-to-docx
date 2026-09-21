/**
 * Inline Page Field Tests
 *
 * <span data-field="page"> and <span data-field="numpages"> become a complex
 * field: begin / instruction / separate / cached result / end, five runs that
 * all carry the run properties the span would have had as ordinary text so the
 * number is set in the type around it.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-validator.js';
import { renderParts, assertWellFormedXML } from './helpers/docx-parts.js';

/** Split a part into its <w:r> elements. */
function findRuns(xml) {
  return [...xml.matchAll(/<w:r>[\s\S]*?<\/w:r>|<w:r\s*\/>/g)].map((m) => m[0]);
}

/**
 * Return the five runs of the first complex field in `xml`, from the run
 * holding fldCharType="begin" to the one holding fldCharType="end".
 */
function findFieldRuns(xml, startIndex = 0) {
  const runs = findRuns(xml);
  const begin = runs.findIndex(
    (run, index) => index >= startIndex && run.includes('fldCharType="begin"')
  );
  if (begin === -1) return [];
  const end = runs.findIndex((run, index) => index > begin && run.includes('fldCharType="end"'));

  return runs.slice(begin, end + 1);
}

/** The <w:rPr> of a run, with whitespace collapsed, or '' when there is none. */
function runProperties(run) {
  const match = run.match(/<w:rPr\s*\/>|<w:rPr>[\s\S]*?<\/w:rPr>/);

  return match ? match[0].replace(/\s+/g, ' ') : '';
}

async function convertBody(html) {
  const buffer = await HTMLtoDOCX(html, null, {}, null);
  const parsed = await parseDOCX(buffer);
  assertWellFormedXML(parsed.xml, 'document.xml');

  return parsed.xml;
}

describe('inline page fields', () => {
  describe('field structure', () => {
    it('should emit five runs in begin/instruction/separate/result/end order', async () => {
      const xml = await convertBody('<p><span data-field="page">1</span></p>');
      const fieldRuns = findFieldRuns(xml);
      expect(fieldRuns).toHaveLength(5);
      expect(fieldRuns[0]).toContain('<w:fldChar w:fldCharType="begin"/>');
      expect(fieldRuns[1]).toContain('<w:instrText xml:space="preserve"> PAGE </w:instrText>');
      expect(fieldRuns[2]).toContain('<w:fldChar w:fldCharType="separate"/>');
      expect(fieldRuns[3]).toContain('<w:t xml:space="preserve">1</w:t>');
      expect(fieldRuns[4]).toContain('<w:fldChar w:fldCharType="end"/>');
    });

    it('should emit the NUMPAGES instruction for data-field="numpages"', async () => {
      const xml = await convertBody('<p><span data-field="numpages">12</span></p>');
      const fieldRuns = findFieldRuns(xml);
      expect(fieldRuns[1]).toContain('<w:instrText xml:space="preserve"> NUMPAGES </w:instrText>');
      expect(fieldRuns[3]).toContain('<w:t xml:space="preserve">12</w:t>');
    });

    it('should accept the field name case-insensitively', async () => {
      const xml = await convertBody('<p><span data-field="PAGE">1</span></p>');
      expect(findFieldRuns(xml)[1]).toContain(' PAGE ');
    });

    it('should use the element text as the cached result', async () => {
      const xml = await convertBody('<p><span data-field="page">42</span></p>');
      expect(findFieldRuns(xml)[3]).toContain('<w:t xml:space="preserve">42</w:t>');
    });

    it('should fall back to "1" when the marker is empty', async () => {
      const xml = await convertBody('<p><span data-field="page"></span></p>');
      expect(findFieldRuns(xml)[3]).toContain('<w:t xml:space="preserve">1</w:t>');
    });

    it('should emit no text run other than the cached result', async () => {
      const xml = await convertBody('<p><span data-field="page">7</span></p>');
      expect(xml.match(/<w:t\b/g)).toHaveLength(1);
    });
  });

  describe('placement', () => {
    it('should work as the only child of a paragraph', async () => {
      const xml = await convertBody('<p><span data-field="page">1</span></p>');
      expect(findFieldRuns(xml)).toHaveLength(5);
    });

    it('should work among other text', async () => {
      const xml = await convertBody(
        '<p>Page <span data-field="page">1</span> of <span data-field="numpages">9</span></p>'
      );
      const runs = findRuns(xml);
      expect(runs[0]).toContain('<w:t xml:space="preserve">Page </w:t>');
      expect(findFieldRuns(xml)[1]).toContain(' PAGE ');
      // The second field follows the first.
      const secondField = findFieldRuns(xml, 7);
      expect(secondField).toHaveLength(5);
      expect(secondField[1]).toContain(' NUMPAGES ');
    });

    it('should work inside a table cell', async () => {
      const xml = await convertBody(
        '<table><tr><td><span data-field="page">1</span></td></tr></table>'
      );
      expect(findFieldRuns(xml)).toHaveLength(5);
    });

    it('should work inside a heading', async () => {
      const xml = await convertBody('<h1>Part <span data-field="page">1</span></h1>');
      expect(findFieldRuns(xml)).toHaveLength(5);
    });
  });

  describe('inherited run properties', () => {
    it('should carry the span own style on every run', async () => {
      const xml = await convertBody(
        '<p><span data-field="page" style="color: #ff0000; font-size: 20px">1</span></p>'
      );
      const fieldRuns = findFieldRuns(xml);
      fieldRuns.forEach((run) => {
        expect(runProperties(run)).toContain('<w:color w:val="ff0000"/>');
        expect(runProperties(run)).toContain('<w:sz w:val="30"/>');
      });
    });

    it('should carry bold from an enclosing <strong>', async () => {
      const xml = await convertBody('<p><strong><span data-field="page">1</span></strong></p>');
      findFieldRuns(xml).forEach((run) => {
        expect(runProperties(run)).toContain('<w:b/>');
      });
    });

    it('should carry italic and underline from enclosing tags', async () => {
      const xml = await convertBody('<p><em><u><span data-field="page">1</span></u></em></p>');
      findFieldRuns(xml).forEach((run) => {
        expect(runProperties(run)).toContain('<w:i/>');
        expect(runProperties(run)).toContain('<w:u ');
      });
    });

    it('should carry the font and colour of an enclosing span', async () => {
      const xml = await convertBody(
        '<p><span style="font-family: Arial; color: #0000ff">' +
          '<span data-field="page">1</span></span></p>'
      );
      findFieldRuns(xml).forEach((run) => {
        expect(runProperties(run)).toContain('w:ascii="Arial"');
        expect(runProperties(run)).toContain('<w:color w:val="0000ff"/>');
      });
    });

    it('should give every run of the field identical properties', async () => {
      const xml = await convertBody(
        '<p><strong><span data-field="page" style="color: #ff0000">1</span></strong></p>'
      );
      const propertiesPerRun = findFieldRuns(xml).map(runProperties);
      expect(new Set(propertiesPerRun).size).toBe(1);
    });
  });

  describe('unrecognised markers', () => {
    it('should render an unknown field name as ordinary text', async () => {
      const xml = await convertBody('<p><span data-field="author">Anon</span></p>');
      expect(xml).not.toContain('<w:fldChar');
      expect(xml).toContain('<w:t xml:space="preserve">Anon</w:t>');
    });

    it('should leave a plain span alone', async () => {
      const xml = await convertBody('<p><span>plain</span></p>');
      expect(xml).not.toContain('<w:fldChar');
      expect(xml).toContain('<w:t xml:space="preserve">plain</w:t>');
    });

    it('should emit nothing field-shaped when no marker is present', async () => {
      const xml = await convertBody('<p>ordinary paragraph</p>');
      expect(xml).not.toContain('<w:fldChar');
      expect(xml).not.toContain('<w:instrText');
    });
  });

  describe('headers and footers', () => {
    it('should emit a well-formed field in header1.xml and footer1.xml', async () => {
      const { headerXml, footerXml } = await renderParts(HTMLtoDOCX, {
        body: '<p>body</p>',
        header: '<p>Page <span data-field="page">1</span></p>',
        footer: '<p>of <span data-field="numpages">9</span></p>',
      });
      assertWellFormedXML(headerXml, 'header1.xml');
      assertWellFormedXML(footerXml, 'footer1.xml');
      expect(headerXml).toContain('fldCharType="begin"');
      expect(headerXml).toContain(' PAGE ');
      expect(footerXml).toContain(' NUMPAGES ');
    });

    it('should keep the legacy pageNumber option working', async () => {
      const { footerXml } = await renderParts(
        HTMLtoDOCX,
        { body: '<p>body</p>', footer: '<p>foot</p>' },
        { pageNumber: true }
      );
      expect(footerXml).toContain('fldSimple');
      assertWellFormedXML(footerXml, 'footer1.xml');
    });

    it('should carry header run properties onto the field runs', async () => {
      const { headerXml } = await renderParts(HTMLtoDOCX, {
        body: '<p>body</p>',
        header: '<p><strong><span data-field="page" style="color: #112233">1</span></strong></p>',
      });
      // The header root declares w as its default namespace, so its runs are
      // serialized without the prefix.
      const boldRuns = headerXml.match(/<b\/>/g) || [];
      expect(boldRuns.length).toBeGreaterThanOrEqual(5);
      expect(headerXml).toContain('val="112233"');
    });
  });
});
