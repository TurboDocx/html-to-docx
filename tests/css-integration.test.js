/**
 * End-to-end integration tests for CSS stylesheet support.
 *
 * Drives the full public API (HTMLtoDOCX) with documentOptions.css and embedded
 * <style> tags, then inspects the generated document.xml to confirm the resolved
 * styling reached the DOCX output.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertRunColor } from './helpers/docx-assertions.js';

describe('CSS stylesheet support - end to end', () => {
  test('documentOptions.css colors a matching paragraph run', async () => {
    const html = '<p class="title">Quarterly Report</p>';
    const css = '.title { color: #ff0000; }';

    const buffer = await HTMLtoDOCX(html, null, { css, deterministicIds: true });
    const parsed = await parseDOCX(buffer);

    assertRunColor(parsed, 0, 'ff0000');
  });

  test('type selector from stylesheet applies text-align to a paragraph', async () => {
    const html = '<p>Centered</p>';
    const css = 'p { text-align: center; }';

    const buffer = await HTMLtoDOCX(html, null, { css, deterministicIds: true });
    const { xml } = await parseDOCX(buffer);

    expect(xml).toContain('<w:jc w:val="center"');
  });

  test('embedded <style> tag styles the body and does not leak as text', async () => {
    const html = '<style>p { color: #00aa00; }</style><p>Body text</p>';

    const buffer = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const parsed = await parseDOCX(buffer);

    assertRunColor(parsed, 0, '00aa00');
    expect(parsed.xml).not.toContain('color: #00aa00'); // raw CSS text not rendered
  });

  test('inline style still overrides a matching stylesheet rule end to end', async () => {
    const html = '<p style="color: #0000ff;">Inline wins</p>';
    const css = 'p { color: #ff0000; }';

    const buffer = await HTMLtoDOCX(html, null, { css, deterministicIds: true });
    const parsed = await parseDOCX(buffer);

    assertRunColor(parsed, 0, '0000ff');
  });

  test('css applies to header and footer fragments', async () => {
    const html = '<p>Body</p>';
    const headerHTML = '<p class="hdr">Header</p>';
    const footerHTML = '<p class="ftr">Footer</p>';
    // text-align is a paragraph-level property (w:jc) that renders in header and
    // footer fragments, proving the stylesheet reaches those converters too.
    const css = '.hdr { text-align: right; } .ftr { text-align: center; }';

    const buffer = await HTMLtoDOCX(
      html,
      headerHTML,
      { css, header: true, footer: true, deterministicIds: true },
      footerHTML
    );

    // header*.xml / footer*.xml live alongside document.xml in the zip
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);
    const names = Object.keys(zip.files);
    const headerName = names.find((n) => /word\/header\d*\.xml$/.test(n));
    const footerName = names.find((n) => /word\/footer\d*\.xml$/.test(n));
    const headerXml = await zip.file(headerName).async('string');
    const footerXml = await zip.file(footerName).async('string');

    // Header/footer fragments serialize with a namespace-prefixed attribute
    // (e.g. `ns1:val`), so match the jc value prefix-agnostically.
    expect(headerXml).toMatch(/<jc\b[^>]*val="right"/);
    expect(footerXml).toMatch(/<jc\b[^>]*val="center"/);
  });

  test('richer CSS properties from a stylesheet render (font, size, background)', async () => {
    // Guards the property list documented in the README / example.
    const html = '<table><tr><th class="hd">Region</th></tr></table>';
    const css = `
      .hd {
        font-family: 'Georgia';
        font-size: 14pt;
        color: #ffffff;
        background-color: #1a3c7a;
      }
    `;

    const buffer = await HTMLtoDOCX(html, null, { css, deterministicIds: true });
    const { xml } = await parseDOCX(buffer);

    expect(xml).toContain('Georgia'); // font-family -> w:rFonts
    expect(xml).toMatch(/<w:sz w:val="28"/); // 14pt -> 28 half-points
    expect(xml).toMatch(/<w:shd[^>]*w:fill="1a3c7a"/); // background-color -> w:shd
    expect(xml).toContain('<w:color w:val="ffffff"'); // color
  });

  test('no css option leaves output unchanged (backward compatible)', async () => {
    const html = '<p>Plain</p>';
    const buffer = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buffer);
    expect(xml).toContain('Plain');
  });
});
