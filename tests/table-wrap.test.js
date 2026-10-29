import JSZip from 'jszip';

import HTMLtoDOCX from '../index.js';

/**
 * A table the text wraps round (canvas task 4.8, the document editor's
 * WrapTable board): `data-wrap` left or right and `data-wrap-gap` px on the
 * <table> give Word's Text wrapping: Around — a floating table at the margin's
 * edge, anchored to the text, the distance on the side facing the text and
 * below, never overlapping another. A table naming none is written as before.
 */

const TWIPS_PER_PX = 15;

const documentXml = async (html) =>
  (await JSZip.loadAsync(await HTMLtoDOCX(html))).file('word/document.xml').async('string');

const tableProperties = (xml) => (xml.match(/<w:tblPr>[\s\S]*?<\/w:tblPr>/) || [''])[0];

const TABLE = (attributes) =>
  `<table ${attributes} style="width: 300px; table-layout: fixed"><tr><td>Fee</td><td>$950</td></tr></table><p>Text beside it</p>`;

describe('a table the text wraps round', () => {
  it('floats at the left margin, its distance on its right and below', async () => {
    const properties = tableProperties(
      await documentXml(TABLE('align="left" data-wrap="left" data-wrap-gap="12"'))
    );

    const float = (properties.match(/<w:tblpPr [^>]*\/>/) || [''])[0];
    expect(float).toContain('w:vertAnchor="text"');
    expect(float).toContain('w:horzAnchor="margin"');
    expect(float).toContain('w:tblpXSpec="left"');
    expect(float).toContain(`w:rightFromText="${12 * TWIPS_PER_PX}"`);
    expect(float).toContain(`w:bottomFromText="${12 * TWIPS_PER_PX}"`);
    expect(float).toContain('w:leftFromText="0"');
    expect(properties).toMatch(/<w:tblOverlap w:val="never"\/>/);
    // Before the table's width, as the schema orders them.
    expect(properties.indexOf('w:tblpPr')).toBeLessThan(properties.indexOf('w:tblW'));
  });

  it('floats at the right margin, its distance on its left', async () => {
    const float = (tableProperties(
      await documentXml(TABLE('align="right" data-wrap="right" data-wrap-gap="20"'))
    ).match(/<w:tblpPr [^>]*\/>/) || [''])[0];

    expect(float).toContain('w:tblpXSpec="right"');
    expect(float).toContain(`w:leftFromText="${20 * TWIPS_PER_PX}"`);
    expect(float).toContain('w:rightFromText="0"');
  });

  it('writes a table that does not wrap as before', async () => {
    const properties = tableProperties(await documentXml(TABLE('align="left"')));

    expect(properties).not.toContain('tblpPr');
    expect(properties).not.toContain('tblOverlap');
  });
});
