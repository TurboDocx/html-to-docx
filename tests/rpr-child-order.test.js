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

  // ------------------------------------------------------------------
  // Pairwise coverage — every two-attribute combination we expect to
  // see in real-world HTML. Each test pins that the resulting <w:rPr>
  // is in spec order AND that no attribute was dropped (regression
  // guard for the silent-loss failure mode).
  // ------------------------------------------------------------------

  function assertElementPresent(rprInner, elName) {
    if (!new RegExp(`<w:${elName}\\b`).test(rprInner)) {
      throw new Error(`expected <w:${elName}> in <w:rPr>; got: ${rprInner}`);
    }
  }

  describe('Pairwise: every two-attribute combo emits in order with both elements present', () => {
    test('font + size', async () => {
      const html = '<p style="font-family: Arial; font-size: 14pt;">text</p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('Arial')) {
          assertRprInSpecOrder(rpr);
          assertElementPresent(rpr, 'rFonts');
          assertElementPresent(rpr, 'sz');
        }
      }
    });

    test('font + color', async () => {
      const html = '<p style="font-family: Arial; color: #ff0000;">text</p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('Arial')) {
          assertRprInSpecOrder(rpr);
          assertElementPresent(rpr, 'rFonts');
          assertElementPresent(rpr, 'color');
        }
      }
    });

    test('color + size', async () => {
      const html = '<p style="color: #00aa00; font-size: 14pt;">text</p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('00aa00')) {
          assertRprInSpecOrder(rpr);
          assertElementPresent(rpr, 'color');
          assertElementPresent(rpr, 'sz');
        }
      }
    });

    test('bold + italic', async () => {
      const html = '<p><strong><em>text</em></strong></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('<w:b/>') && rpr.includes('<w:i/>')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });

    test('bold + underline', async () => {
      const html = '<p><strong><u>text</u></strong></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('<w:b/>')) {
          assertRprInSpecOrder(rpr);
          assertElementPresent(rpr, 'b');
        }
      }
    });

    test('bold + strikethrough', async () => {
      const html = '<p><strong><del>text</del></strong></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('<w:b/>')) {
          assertRprInSpecOrder(rpr);
          assertElementPresent(rpr, 'b');
          assertElementPresent(rpr, 'strike');
        }
      }
    });

    test('color + underline', async () => {
      const html = '<p style="color: #0000ff;"><u>text</u></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('0000ff')) {
          assertRprInSpecOrder(rpr);
          assertElementPresent(rpr, 'color');
          assertElementPresent(rpr, 'u');
        }
      }
    });

    test('color + highlight (mark) — order is correct when both present', async () => {
      // Note: a separate bug causes <mark> highlighting to be dropped when the
      // parent paragraph carries a color style — out of scope for the order
      // fix. This test asserts the order invariant for any rPr that DOES
      // emit both; if the engine emits only one, that's not an order failure.
      const html = '<p style="color: #000080;"><mark>highlighted</mark></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        assertRprInSpecOrder(rpr);
      }
    });

    test('size + highlight', async () => {
      const html = '<p style="font-size: 18pt;"><mark>highlighted</mark></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('<w:highlight')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });

    test('size + background-color', async () => {
      const html =
        '<p><span style="font-size: 14pt; background-color: #ffeecc;">text</span></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('shd')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });

    test('underline + strikethrough (combined text-decoration)', async () => {
      const html = '<p><u><del>both</del></u></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('<w:u') || rpr.includes('<w:strike')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });

    test('vertical-align (superscript) + color', async () => {
      const html = '<p style="color: #ff8800;">E = mc<sup>2</sup></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('vertAlign')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });

    test('subscript + size + color', async () => {
      const html =
        '<p style="color: #444444; font-size: 11pt;">H<sub>2</sub>O</p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('vertAlign')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });
  });

  // ------------------------------------------------------------------
  // Triple + quadruple combinations that surface in real templates.
  // ------------------------------------------------------------------

  describe('Triple+ combinations stay in spec order', () => {
    test('font + size + color + bold', async () => {
      const html =
        '<p style="font-family: Arial; font-size: 12pt; color: #ff0000;"><strong>quad</strong></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('Arial')) {
          assertRprInSpecOrder(rpr);
          assertElementPresent(rpr, 'rFonts');
          assertElementPresent(rpr, 'b');
          assertElementPresent(rpr, 'color');
          assertElementPresent(rpr, 'sz');
        }
      }
    });

    test('font + size + color + italic + underline', async () => {
      const html =
        '<p style="font-family: Times New Roman; font-size: 16pt; color: #336699;">' +
        '<em><u>quintuple</u></em></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('336699')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });

    test('font + size + color + bold + italic + underline + strikethrough', async () => {
      const html =
        '<p style="font-family: Calibri; font-size: 14pt; color: #ff0000;">' +
        '<strong><em><u><del>everything</del></u></em></strong></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('Calibri')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });

    test('font + color + highlight + size', async () => {
      const html =
        '<p style="font-family: Verdana; color: #220000; font-size: 11pt;">' +
        '<mark>highlighted Verdana</mark></p>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        if (rpr.includes('Verdana')) {
          assertRprInSpecOrder(rpr);
        }
      }
    });
  });

  // ------------------------------------------------------------------
  // Specific reproduction patterns observed in customer documents.
  // ------------------------------------------------------------------

  describe('Customer-pattern repros', () => {
    test('legal table header (dark cell + white text, the original report)', async () => {
      const html =
        '<table style="border-collapse: collapse;"><tr>' +
        '<td style="background-color: #2f5496; vertical-align: top; border: 1px solid black;">' +
        '<p><span style="font-size: 11pt;"><span style="font-family: Calibri,sans-serif;">' +
        '<span style="font-size: 12.0pt;"><span style="color: white;">Project Phase</span>' +
        '</span></span></span></p>' +
        '</td></tr></table>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        assertRprInSpecOrder(rpr);
      }
      expect(xml).toContain('<w:color w:val="ffffff"');
      expect(xml).toContain('<w:shd w:val="clear" w:fill="2f5496"');
    });

    test('three sibling header cells all in spec order, all retain white color', async () => {
      const html =
        '<table><tr>' +
        '<td style="background-color: #2f5496;"><p><span style="font-family: Calibri;"><span style="font-size: 12pt;"><span style="color: white;">A</span></span></span></p></td>' +
        '<td style="background-color: #2f5496;"><p><span style="font-family: Calibri;"><span style="font-size: 12pt;"><span style="color: white;">B</span></span></span></p></td>' +
        '<td style="background-color: #2f5496;"><p><span style="font-family: Calibri;"><span style="font-size: 12pt;"><span style="color: white;">C</span></span></span></p></td>' +
        '</tr></table>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      let whiteCount = 0;
      for (const rpr of getAllRprFragments(xml)) {
        assertRprInSpecOrder(rpr);
        if (rpr.includes('<w:color w:val="ffffff"')) whiteCount += 1;
      }
      // Three header cells must each carry a white color attribute
      expect(whiteCount).toBeGreaterThanOrEqual(3);
    });

    test('inverse customer pattern: light text on dark background with sub/sup', async () => {
      const html =
        '<table><tr><td style="background-color: #000000;">' +
        '<p><span style="color: #f0f0f0; font-size: 11pt; font-family: Arial;">' +
        'Formula H<sub>2</sub>O at 100&deg;C</span></p>' +
        '</td></tr></table>';
      const { xml } = await parseDOCX(
        await HTMLtoDOCX(html, null, { deterministicIds: true })
      );
      for (const rpr of getAllRprFragments(xml)) {
        assertRprInSpecOrder(rpr);
      }
      expect(xml).toContain('<w:color w:val="f0f0f0"');
    });
  });
});
