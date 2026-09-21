/**
 * <w:pPr> child order tests.
 *
 * ECMA-376 (Part 1, §17.3.1.26 / §17.3.1.25) defines a STRICT sequence for
 * the child elements of <w:pPr>, the same way it does for <w:rPr> (see
 * rpr-child-order.test.js). Word expects that sequence; LibreOffice ignores
 * violations, so out-of-order output goes unnoticed in LibreOffice-based
 * testing.
 *
 * The paragraph builder used to emit children in the order the CSS
 * properties happened to be declared (e.g. <w:jc/> before <w:spacing/>,
 * <w:shd/> before <w:pBdr/>, <w:bidi/> before <w:pStyle/>). These tests pin
 * the spec order for every paragraph the document produces.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

// CT_PPrBase followed by the CT_PPr additions, in spec sequence.
const PPR_SPEC_ORDER = [
  'pStyle',
  'keepNext',
  'keepLines',
  'pageBreakBefore',
  'framePr',
  'widowControl',
  'numPr',
  'suppressLineNumbers',
  'pBdr',
  'shd',
  'tabs',
  'suppressAutoHyphens',
  'kinsoku',
  'wordWrap',
  'overflowPunct',
  'topLinePunct',
  'autoSpaceDE',
  'autoSpaceDN',
  'bidi',
  'adjustRightInd',
  'snapToGrid',
  'spacing',
  'ind',
  'contextualSpacing',
  'mirrorIndents',
  'suppressOverlap',
  'jc',
  'textDirection',
  'textAlignment',
  'textboxTightWrap',
  'outlineLvl',
  'divId',
  'cnfStyle',
  'rPr',
  'sectPr',
  'pPrChange',
];

// Direct child element names of the first <w:pPr> in a paragraph, in order.
const pPrChildren = (paragraphXml) => {
  const match = paragraphXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/);
  if (!match) return [];
  const names = [];
  const childRe = /<w:([a-zA-Z]+)\b[^>]*?(\/>|>[\s\S]*?<\/w:\1>)/g;
  let child;
  while ((child = childRe.exec(match[1])) !== null) {
    names.push(child[1]);
  }
  return names;
};

// Only elements that are part of CT_PPr take part in the ordering check.
const expectSpecOrder = (paragraphXml) => {
  const known = pPrChildren(paragraphXml).filter((name) => PPR_SPEC_ORDER.includes(name));
  const sorted = [...known].sort((a, b) => PPR_SPEC_ORDER.indexOf(a) - PPR_SPEC_ORDER.indexOf(b));
  expect(known).toEqual(sorted);
};

const paragraphsOf = async (html, options = {}) => {
  const docx = await HTMLtoDOCX(html, null, options);
  const parsed = await parseDOCX(docx);
  return parsed.paragraphs;
};

describe('<w:pPr> child order', () => {
  test('text-align declared before line-height still emits <w:spacing> before <w:jc>', async () => {
    const [paragraph] = await paragraphsOf(
      '<p style="text-align: center; line-height: 1.5; margin-bottom: 10px">Centered</p>'
    );

    expect(pPrChildren(paragraph.xml)).toEqual(['spacing', 'jc']);
  });

  test('indentation is emitted after spacing and before justification', async () => {
    const [paragraph] = await paragraphsOf(
      '<p style="text-align: right; margin-left: 20px; margin-right: 10px">Indented</p>'
    );

    expect(pPrChildren(paragraph.xml)).toEqual(['spacing', 'ind', 'jc']);
  });

  test('list item keeps <w:numPr> ahead of spacing and justification', async () => {
    const [paragraph] = await paragraphsOf('<ul><li style="text-align: center">Item</li></ul>');

    expect(pPrChildren(paragraph.xml)).toEqual(['numPr', 'spacing', 'jc']);
  });

  test('heading page break keeps <w:pStyle> first and <w:pageBreakBefore> next', async () => {
    const [paragraph] = await paragraphsOf(
      '<h2 style="text-align: center; page-break-before: always">Chapter</h2>'
    );

    expect(pPrChildren(paragraph.xml)).toEqual(['pStyle', 'pageBreakBefore', 'spacing', 'jc']);
  });

  test('shaded block paragraph emits <w:pBdr> before <w:shd>', async () => {
    const [paragraph] = await paragraphsOf(
      '<p style="background-color: #eeeeee; display: block">Shaded</p>'
    );

    expect(pPrChildren(paragraph.xml)).toEqual(['pBdr', 'shd', 'spacing']);
  });

  test('RTL documents emit <w:bidi> after <w:pStyle> and before spacing', async () => {
    const [paragraph] = await paragraphsOf('<h1 style="text-align: right">Title</h1>', {
      direction: 'rtl',
    });

    const known = pPrChildren(paragraph.xml).filter((name) => PPR_SPEC_ORDER.includes(name));
    expect(known).toEqual(['pStyle', 'bidi', 'spacing', 'jc']);
  });

  test('every paragraph of a mixed document follows the spec sequence', async () => {
    const paragraphs = await paragraphsOf(`
      <h1 style="text-align: center; page-break-before: always">Heading</h1>
      <p style="text-align: justify; margin-left: 1in; line-height: 2; margin-bottom: 4pt">Body</p>
      <p style="text-align: center; background-color: yellow; display: block">Shaded</p>
      <ol><li style="text-align: right; margin-right: 12px">One</li></ol>
      <blockquote>Quote</blockquote>
    `);

    expect(paragraphs.length).toBeGreaterThan(0);
    paragraphs.forEach((paragraph) => expectSpecOrder(paragraph.xml));
  });
});
