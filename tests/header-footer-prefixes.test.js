/**
 * Header and Footer Prefix Tests
 *
 * A header or footer part is written in the same prefixed WordprocessingML as
 * document.xml: <w:hdr>, <w:p>, <w:r>, <w:t>, w:val — not <hdr xmlns="…"> with
 * unprefixed children and generated ns1:, ns2: attribute prefixes.
 *
 * The two spellings name the same elements, and Word reads either. Template
 * engines do not: docxtemplater (and every OOXML tool that matches tags by
 * name) looks for `w:t`, so a {placeholder} written into an unprefixed header
 * was invisible to it — never discovered as a template variable, never filled
 * in. The body never had the problem because its root declares the prefixes;
 * the bands' roots declared none.
 */

import HTMLtoDOCX from '../index.js';
import { renderParts, assertWellFormedXML } from './helpers/docx-parts.js';

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/** Every element name in a part, without its attributes. */
function elementNames(xml) {
  return [...xml.matchAll(/<([A-Za-z][\w.-]*(?::[\w.-]+)?)[\s/>]/g)].map((m) => m[1]);
}

/** Element names written with no prefix at all. */
function unprefixedElements(xml) {
  return elementNames(xml).filter((name) => !name.includes(':'));
}

async function renderBands(header, footer) {
  return renderParts(HTMLtoDOCX, { body: '<p>body</p>', header, footer });
}

describe('header and footer parts', () => {
  it('should write the header in w:-prefixed WordprocessingML, as the body is', async () => {
    const { headerXml } = await renderBands('<p>Proposal for <strong>{ClientName}</strong></p>');

    assertWellFormedXML(headerXml, 'header1.xml');
    expect(headerXml).toMatch(/<w:hdr[\s>]/);
    expect(headerXml).toContain(`xmlns:w="${W_NS}"`);
    expect(headerXml).not.toContain(`xmlns="${W_NS}"`);
    expect(unprefixedElements(headerXml)).toEqual([]);
    expect(headerXml).not.toMatch(/\sns\d+:/);
  });

  it('should write the footer in w:-prefixed WordprocessingML, as the body is', async () => {
    const { footerXml } = await renderBands(undefined, '<p>Ref {DocumentRef}</p>');

    assertWellFormedXML(footerXml, 'footer1.xml');
    expect(footerXml).toMatch(/<w:ftr[\s>]/);
    expect(footerXml).toContain(`xmlns:w="${W_NS}"`);
    expect(unprefixedElements(footerXml)).toEqual([]);
    expect(footerXml).not.toMatch(/\sns\d+:/);
  });

  it('should keep a {placeholder} whole in a w:t, where a template engine reads it', async () => {
    const { headerXml, footerXml } = await renderBands(
      '<p><span style="text-transform: none">{CompanyName}</span></p>',
      '<p>Ref <span style="text-transform: none">{DocumentRef}</span></p>'
    );

    expect(headerXml).toMatch(/<w:t(?:\s[^>]*)?>\{CompanyName\}<\/w:t>/);
    expect(footerXml).toMatch(/<w:t(?:\s[^>]*)?>\{DocumentRef\}<\/w:t>/);
  });

  it('should prefix what a band holds beyond text: tables, fields and shapes', async () => {
    const rect =
      '<span data-shape="rect" data-left="0" data-top="0" data-width="794" data-height="96" data-fill="#EEF2FF"></span>';
    const { headerXml } = await renderBands(
      '<table style="width: 602px; border-collapse: collapse"><tr>' +
        '<td style="width: 546px"><p>{CompanyName}</p></td>' +
        '<td style="width: 56px"><p><span data-field="page">1</span></p></td>' +
        `</tr></table><p>${rect}</p>`
    );

    assertWellFormedXML(headerXml, 'header1.xml');
    expect(headerXml).toContain('<w:tbl>');
    expect(headerXml).toContain('<w:fldChar w:fldCharType="begin"/>');
    expect(headerXml).toMatch(/<wp:anchor[\s>]/);
    expect(headerXml).toMatch(/<a:graphic[\s>]/);
    expect(unprefixedElements(headerXml)).toEqual([]);
    expect(headerXml).not.toMatch(/\sns\d+:/);
  });

  it('should keep the legacy page number in the footer, prefixed', async () => {
    const { footerXml } = await renderParts(
      HTMLtoDOCX,
      { body: '<p>body</p>', footer: '<p>foot</p>' },
      { pageNumber: true }
    );

    expect(footerXml).toContain('<w:fldSimple w:instr="PAGE">');
    expect(unprefixedElements(footerXml)).toEqual([]);
  });
});
