/**
 * Container style inheritance tests (issue #268).
 *
 * Inheritable text styles (font-family, color, font-size, line-height, ...)
 * set on a container element such as a wrapping <div> must cascade to the
 * text inside it, the way CSS inheritance works. A child's own style wins.
 *
 * Box styles (margin, background, page-break-*) are NOT inherited in CSS and
 * must not be copied onto children.
 */

import HTMLtoDOCX from '../index';
import { parseDOCX } from './helpers/docx-assertions';

async function bodyXml(html) {
  const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
  const { xml } = await parseDOCX(buf);
  return xml;
}

// Inner XML of every element matching `re` whose text contains `needle`
function elementsWithText(xml, re, needle) {
  return [...xml.matchAll(re)].map((m) => m[1]).filter((inner) => inner.includes(`>${needle}<`));
}

function runsWithText(xml, needle) {
  const runs = elementsWithText(xml, /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g, needle);
  if (runs.length === 0) throw new Error(`No run found with text "${needle}"`);
  return runs;
}

function paragraphWithText(xml, needle) {
  const paragraphs = elementsWithText(xml, /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g, needle);
  if (paragraphs.length === 0) throw new Error(`No paragraph found with text "${needle}"`);
  return paragraphs[0];
}

const fontOf = (run) => {
  const m = run.match(/<w:rFonts w:ascii="([^"]+)"/);
  return m ? m[1] : null;
};
const colorOf = (run) => {
  const m = run.match(/<w:color w:val="([^"]+)"/);
  return m ? m[1].toUpperCase() : null;
};
const sizeOf = (run) => {
  const m = run.match(/<w:sz w:val="([^"]+)"/);
  return m ? m[1] : null;
};

describe('Container style inheritance (issue #268)', () => {
  test('font-family on a wrapping div reaches heading, paragraph and bold runs', async () => {
    const xml = await bodyXml(
      '<div style="font-family: Arial, sans-serif;">' +
        '<h1>Title</h1>' +
        '<p>Some <strong>body</strong> text.</p>' +
        '</div>'
    );
    expect(fontOf(runsWithText(xml, 'Title')[0])).toBe('Arial');
    expect(fontOf(runsWithText(xml, 'Some ')[0])).toBe('Arial');
    expect(fontOf(runsWithText(xml, 'body')[0])).toBe('Arial');
    expect(fontOf(runsWithText(xml, ' text.')[0])).toBe('Arial');
  });

  test('bare text directly inside a styled div gets the div font', async () => {
    const xml = await bodyXml('<div style="font-family: Arial;">bare text</div>');
    expect(fontOf(runsWithText(xml, 'bare text')[0])).toBe('Arial');
  });

  test('font-family cascades through nested unstyled divs', async () => {
    const xml = await bodyXml('<div style="font-family: Arial;"><div><p>Deep</p></div></div>');
    expect(fontOf(runsWithText(xml, 'Deep')[0])).toBe('Arial');
  });

  test("a child's own font-family wins over the inherited one", async () => {
    const xml = await bodyXml(
      '<div style="font-family: Arial;">' +
        '<p style="font-family: Georgia;">Own</p>' +
        '<p>Inherited</p>' +
        '</div>'
    );
    expect(fontOf(runsWithText(xml, 'Own')[0])).toBe('Georgia');
    expect(fontOf(runsWithText(xml, 'Inherited')[0])).toBe('Arial');
  });

  test('an inner div style overrides an outer div style for its subtree', async () => {
    const xml = await bodyXml(
      '<div style="font-family: Arial; color: #ff0000;">' +
        '<div style="font-family: Georgia;"><p>Inner</p></div>' +
        '<p>Outer</p>' +
        '</div>'
    );
    const inner = runsWithText(xml, 'Inner')[0];
    expect(fontOf(inner)).toBe('Georgia');
    // color was not overridden by the inner div, so it still cascades
    expect(colorOf(inner)).toBe('FF0000');
    expect(fontOf(runsWithText(xml, 'Outer')[0])).toBe('Arial');
  });

  test('color and font-size on a wrapping div cascade to runs', async () => {
    const xml = await bodyXml(
      '<div style="color: #ff0000; font-size: 20pt;"><p>Colored <em>text</em></p></div>'
    );
    ['Colored ', 'text'].forEach((needle) => {
      const run = runsWithText(xml, needle)[0];
      expect(colorOf(run)).toBe('FF0000');
      expect(sizeOf(run)).toBe('40');
    });
  });

  test('line-height on a wrapping div cascades to paragraph spacing', async () => {
    const xml = await bodyXml('<div style="line-height: 24pt;"><p>Spaced</p></div>');
    expect(paragraphWithText(xml, 'Spaced')).toMatch(/<w:spacing[^>]*w:line="480"/);
  });

  test('text-align on a wrapping div cascades to paragraph justification', async () => {
    const xml = await bodyXml('<div style="text-align: center;"><p>Centered</p></div>');
    expect(paragraphWithText(xml, 'Centered')).toMatch(/<w:jc w:val="center"/);
  });

  test('other container elements (section, article) also cascade styles', async () => {
    const xml = await bodyXml(
      '<section style="font-family: Arial;"><p>InSection</p></section>' +
        '<article style="font-family: Georgia;"><p>InArticle</p></article>'
    );
    expect(fontOf(runsWithText(xml, 'InSection')[0])).toBe('Arial');
    expect(fontOf(runsWithText(xml, 'InArticle')[0])).toBe('Georgia');
  });

  test('a div with page-break styles still cascades its text styles', async () => {
    const xml = await bodyXml(
      '<div style="page-break-before: always; font-family: Arial;"><p>AfterBreak</p></div>'
    );
    expect(fontOf(runsWithText(xml, 'AfterBreak')[0])).toBe('Arial');
  });

  test('inherited font-size does not flatten headings, but font-family still reaches them', async () => {
    const xml = await bodyXml(
      '<div style="font-size: 12pt; font-family: Arial;"><h1>BigTitle</h1><p>Body</p></div>'
    );
    const heading = runsWithText(xml, 'BigTitle')[0];
    // No explicit size: the Heading1 style keeps the heading larger than body text
    expect(sizeOf(heading)).toBeNull();
    expect(fontOf(heading)).toBe('Arial');
    expect(sizeOf(runsWithText(xml, 'Body')[0])).toBe('24');
  });

  test("a heading's own font-size still applies inside a sized container", async () => {
    const xml = await bodyXml(
      '<div style="font-size: 12pt;"><h2 style="font-size: 30pt;">OwnSize</h2></div>'
    );
    expect(sizeOf(runsWithText(xml, 'OwnSize')[0])).toBe('60');
  });

  test('<pre> keeps its monospace font inside a font-styled container', async () => {
    const xml = await bodyXml(
      '<div style="font-family: Arial; color: #ff0000;"><pre>PreText</pre></div>'
    );
    const run = runsWithText(xml, 'PreText')[0];
    expect(fontOf(run)).toBe('Courier');
    // Other inheritable styles still reach the <pre>
    expect(colorOf(run)).toBe('FF0000');
  });

  test("<pre>'s own font-family still wins", async () => {
    const xml = await bodyXml(
      '<div style="font-family: Arial;"><pre style="font-family: Consolas;">OwnPre</pre></div>'
    );
    expect(fontOf(runsWithText(xml, 'OwnPre')[0])).toBe('Consolas');
  });

  test('table cells inside a styled div get the font and color', async () => {
    const xml = await bodyXml(
      '<div style="font-family: Arial; color: #ff0000;">' +
        '<table><thead><tr><th>Head</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>' +
        '</div>'
    );
    ['Head', 'Cell'].forEach((needle) => {
      const run = runsWithText(xml, needle)[0];
      expect(fontOf(run)).toBe('Arial');
      expect(colorOf(run)).toBe('FF0000');
    });
  });

  test('font-family on a table itself reaches its cells, and row/cell styles win', async () => {
    const xml = await bodyXml(
      '<table style="font-family: Arial;">' +
        '<tr><td>Plain</td></tr>' +
        '<tr style="font-family: Georgia;"><td>RowOwn</td></tr>' +
        '<tr><td style="font-family: Verdana;">CellOwn</td></tr>' +
        '</table>'
    );
    expect(fontOf(runsWithText(xml, 'Plain')[0])).toBe('Arial');
    expect(fontOf(runsWithText(xml, 'RowOwn')[0])).toBe('Georgia');
    expect(fontOf(runsWithText(xml, 'CellOwn')[0])).toBe('Verdana');
  });

  test('list items inside a styled div get the font', async () => {
    const xml = await bodyXml('<div style="font-family: Arial;"><ul><li>Item</li></ul></div>');
    expect(fontOf(runsWithText(xml, 'Item')[0])).toBe('Arial');
  });

  test('text-shadow on a wrapping div cascades to runs', async () => {
    const xml = await bodyXml('<div style="text-shadow: 1px 1px 2px #000;"><p>Shadowed</p></div>');
    expect(runsWithText(xml, 'Shadowed')[0]).toMatch(/<w:shadow\b/);
  });

  test('an image in a text-align div is centered without invalid attributes on <w:jc>', async () => {
    const png =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const xml = await bodyXml(`<div style="text-align: center;"><img src="${png}"></div>`);
    expect(xml).toMatch(/<w:jc w:val="center"\/>/);
    expect(xml).not.toMatch(/<w:jc[^>]*w:lineRule/);
  });

  test('<div class="page-break"> still emits only a page break', async () => {
    const xml = await bodyXml(
      '<p>Before</p><div class="page-break" style="font-family: Arial;"></div><p>After</p>'
    );
    expect(xml.match(/<w:br w:type="page"\/>/g)).toHaveLength(1);
    expect(fontOf(runsWithText(xml, 'After')[0])).toBeNull();
  });

  test('non-inherited box styles on a div are not copied to children', async () => {
    const xml = await bodyXml(
      '<div style="font-family: Arial; margin-left: 2in; background-color: #00ff00; page-break-after: always;">' +
        '<p>First</p><p>Second</p>' +
        '</div>'
    );
    ['First', 'Second'].forEach((needle) => {
      const para = paragraphWithText(xml, needle);
      expect(para).not.toMatch(/<w:ind\b/);
      expect(para).not.toMatch(/<w:shd\b/);
      expect(para).not.toMatch(/<w:br w:type="page"/);
    });
    // The div's own page-break-after still produces exactly one break
    expect(xml.match(/<w:br w:type="page"\/>/g)).toHaveLength(1);
  });
});
