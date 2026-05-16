/**
 * <w:rPr> child order tests.
 *
 * ECMA-376 (Part 1, §17.3.2.27) defines a STRICT sequence for the child
 * elements of <w:rPr>. Microsoft Word enforces this order — out-of-order
 * children are silently dropped from the rendered run. LibreOffice is
 * forgiving and ignores the violation, which is why the bug ships
 * undetected through LibreOffice-based testing.
 *
 * Observed reproducer (user report): a table header cell with the HTML
 *
 *   <td style="background-color: #2f5496;">
 *     <p><span style="font-size: 11pt;">
 *       <span style="font-family: Calibri, sans-serif;">
 *         <span style="font-size: 12.0pt;">
 *           <span style="color: white;">Project Phase</span>
 *         </span>
 *       </span>
 *     </span></p>
 *   </td>
 *
 * produced <w:rPr><w:sz/><w:rFonts/><w:color/></w:rPr>, which Word
 * renders as default-black on the dark-blue cell — invisible to the
 * reader. Sorting the children to <w:rFonts/><w:color/>...<w:sz/>
 * matches the spec and Word renders the white correctly.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

// Subset of EG_RPrBase that we currently emit. Each entry is the OOXML
// element name in spec sequence; smaller index = appears earlier.
const RPR_SPEC_ORDER = [
  'rStyle',
  'rFonts',
  'b',
  'bCs',
  'i',
  'iCs',
  'caps',
  'smallCaps',
  'strike',
  'dstrike',
  'outline',
  'shadow',
  'emboss',
  'imprint',
  'noProof',
  'snapToGrid',
  'vanish',
  'webHidden',
  'color',
  'spacing',
  'w',
  'kern',
  'position',
  'sz',
  'szCs',
  'highlight',
  'u',
  'effect',
  'bdr',
  'shd',
  'fitText',
  'vertAlign',
  'rtl',
  'cs',
  'em',
  'lang',
  'eastAsianLayout',
  'specVanish',
  'oMath',
];

function specPos(elName) {
  const idx = RPR_SPEC_ORDER.indexOf(elName);
  return idx === -1 ? Infinity : idx;
}

function rprChildrenInOrder(rprInner) {
  // Pull child element names in source order from the raw <w:rPr> inner XML
  return [...rprInner.matchAll(/<w:([a-zA-Z][a-zA-Z0-9]*)\b/g)].map((m) => m[1]);
}

function assertRprInSpecOrder(rprInner) {
  const children = rprChildrenInOrder(rprInner);
  let lastPos = -1;
  let lastName = null;
  for (const name of children) {
    const p = specPos(name);
    if (p < lastPos) {
      throw new Error(
        `<w:rPr> child <w:${name}> (spec slot ${p}) appears after <w:${lastName}> (spec slot ${lastPos}). Full order: ${children.join(', ')}`
      );
    }
    lastPos = p;
    lastName = name;
  }
}

function getAllRprFragments(xml) {
  return [...xml.matchAll(/<w:rPr>([\s\S]*?)<\/w:rPr>/g)].map((m) => m[1]);
}

describe('<w:rPr> child element order (ECMA-376 EG_RPrBase)', () => {
  test('deeply-nested span color + size + font emits children in spec order', async () => {
    const html =
      '<p>' +
      '<span style="font-size: 11pt;">' +
      '<span style="font-family: Calibri, sans-serif;">' +
      '<span style="font-size: 12.0pt;">' +
      '<span style="color: white;">Project Phase</span>' +
      '</span></span></span></p>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);
    for (const rpr of getAllRprFragments(xml)) {
      assertRprInSpecOrder(rpr);
    }
  });

  test('table cell with dark background + white text emits rPr in spec order', async () => {
    const html =
      '<table style="border-collapse: collapse;"><tr>' +
      '<td style="background-color: #2f5496;">' +
      '<p><span style="font-size: 11pt;">' +
      '<span style="font-family: Calibri,sans-serif;">' +
      '<span style="font-size: 12.0pt;">' +
      '<span style="color: white;">Project Phase</span>' +
      '</span></span></span></p>' +
      '</td>' +
      '</tr></table>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);
    for (const rpr of getAllRprFragments(xml)) {
      assertRprInSpecOrder(rpr);
    }
    // And the white color must still be present (regression guard for the
    // out-of-order Word-drop scenario).
    expect(xml).toContain('<w:color w:val="ffffff"');
  });

  test('bold + italic + underline + strike + color + size in one run stays ordered', async () => {
    const html =
      '<p style="color: #ff0000; font-size: 14pt;">' +
      '<strong><em><u><del>everything</del></u></em></strong></p>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);
    for (const rpr of getAllRprFragments(xml)) {
      assertRprInSpecOrder(rpr);
    }
  });

  test('every <w:rPr> in a complex multi-row table stays in spec order', async () => {
    const html = `
      <table style="border-collapse: collapse;">
        <tr>
          <td style="background-color: #2f5496; border: 1px solid black;">
            <p><span style="font-size: 11pt;"><span style="font-family: Calibri, sans-serif;">
              <span style="font-size: 12pt;"><span style="color: white;">Header A</span></span>
            </span></span></p>
          </td>
          <td style="background-color: #2f5496;">
            <p><span style="font-size: 11pt;"><span style="font-family: Calibri, sans-serif;">
              <span style="font-size: 12pt;"><span style="color: white;">Header B</span></span>
            </span></span></p>
          </td>
        </tr>
        <tr>
          <td>
            <p><span style="font-family: Arial;"><strong>Bold body</strong></span></p>
          </td>
          <td>
            <p><em><u style="color: #008000;">Underlined green</u></em></p>
          </td>
        </tr>
      </table>
    `;
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);
    const fragments = getAllRprFragments(xml);
    expect(fragments.length).toBeGreaterThan(0);
    for (const rpr of fragments) {
      assertRprInSpecOrder(rpr);
    }
  });
});
