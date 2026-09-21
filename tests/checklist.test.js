/**
 * Checklist tests: <ul data-checklist="true"> items render as indented
 * paragraphs that start with a checkbox glyph instead of list numbering.
 *
 *   <ul data-checklist="true">
 *     <li data-checked="true" data-strike="true">Done</li>
 *     <li data-checked="false">To do</li>
 *   </ul>
 *
 * Glyphs: U+2610 (unchecked) and U+2611 (checked) in "Segoe UI Symbol",
 * followed by a tab to the hanging indent, like a list marker.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphCount } from './helpers/docx-assertions.js';

const UNCHECKED = '☐';
const CHECKED = '☑';

const convert = async (html) => {
  const docx = await HTMLtoDOCX(html, null, {});
  const parsed = await parseDOCX(docx);
  const numberingXml = await parsed.zip.file('word/numbering.xml').async('string');
  return { ...parsed, numberingXml };
};

// Drop the pretty-print indentation (newline + spaces) between tags only, so
// whitespace-only text such as <w:t> </w:t> is preserved.
const compact = (xml) => xml.replace(/>\n\s*</g, '><');

// Runs of a paragraph in order: { xml, text, tab, strike }.
const runsOf = (paragraph) =>
  (compact(paragraph.xml).match(/<w:r>[\s\S]*?<\/w:r>/g) || []).map((runXml) => ({
    xml: runXml,
    text: (runXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/) || [])[1],
    tab: runXml.includes('<w:tab/>'),
    strike: /<w:strike\b/.test(runXml),
  }));

const pPrOf = (paragraph) => (compact(paragraph.xml).match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [''])[0];

const expectCheckbox = (paragraph, glyph) => {
  const [glyphRun, tabRun] = runsOf(paragraph);
  expect(glyphRun.text).toBe(glyph);
  expect(glyphRun.xml).toContain(
    '<w:rFonts w:ascii="Segoe UI Symbol" w:hAnsi="Segoe UI Symbol" w:eastAsia="Segoe UI Symbol" w:cs="Segoe UI Symbol"/>'
  );
  expect(tabRun.tab).toBe(true);
};

describe('Checklists (<ul data-checklist="true">)', () => {
  test('renders unchecked and checked items with checkbox glyphs instead of numbering', async () => {
    const parsed = await convert(
      '<ul data-checklist="true"><li data-checked="false">To do</li><li data-checked="true">Done</li></ul>'
    );

    assertParagraphCount(parsed, 2);
    expectCheckbox(parsed.paragraphs[0], UNCHECKED);
    expectCheckbox(parsed.paragraphs[1], CHECKED);
    expect(runsOf(parsed.paragraphs[0])[2].text).toBe('To do');
    expect(runsOf(parsed.paragraphs[1])[2].text).toBe('Done');
    parsed.paragraphs.forEach((paragraph) => expect(paragraph.xml).not.toContain('<w:numPr>'));
    expect(parsed.numberingXml).not.toContain('<w:abstractNum ');
  });

  test('indents items like a list item with the glyph in the hanging indent', async () => {
    const parsed = await convert('<ul data-checklist="true"><li>Item</li></ul>');
    const pPr = pPrOf(parsed.paragraphs[0]);

    expect(pPr).toContain('<w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs>');
    expect(pPr).toContain('<w:ind w:left="720" w:hanging="360"/>');
    expectCheckbox(parsed.paragraphs[0], UNCHECKED);
  });

  test('strikes the text of a checked item with data-strike="true"', async () => {
    const parsed = await convert(
      '<ul data-checklist="true"><li data-checked="true" data-strike="true">Done <strong>bold</strong> <span style="color: red">red</span></li></ul>'
    );
    const [glyphRun, tabRun, ...textRuns] = runsOf(parsed.paragraphs[0]);

    expect(glyphRun.strike).toBe(false);
    expect(tabRun.strike).toBe(false);
    expect(textRuns.map((run) => run.text)).toEqual(['Done ', 'bold', ' ', 'red']);
    textRuns.forEach((run) => expect(run.strike).toBe(true));
  });

  test.each([
    ['data-checked="false" data-strike="true"'],
    ['data-checked="true" data-strike="false"'],
    ['data-checked="true"'],
  ])('does not strike an item with %s', async (attributes) => {
    const parsed = await convert(`<ul data-checklist="true"><li ${attributes}>Item</li></ul>`);

    runsOf(parsed.paragraphs[0]).forEach((run) => expect(run.strike).toBe(false));
  });

  test('indents nested checklists one level deeper', async () => {
    const parsed = await convert(`
      <ul data-checklist="true">
        <li data-checked="false">Parent
          <ul data-checklist="true">
            <li data-checked="true">Child
              <ul data-checklist="true"><li>Grandchild</li></ul>
            </li>
          </ul>
        </li>
      </ul>
    `);

    assertParagraphCount(parsed, 3);
    expectCheckbox(parsed.paragraphs[0], UNCHECKED);
    expectCheckbox(parsed.paragraphs[1], CHECKED);
    expectCheckbox(parsed.paragraphs[2], UNCHECKED);
    expect(pPrOf(parsed.paragraphs[0])).toContain('<w:ind w:left="720" w:hanging="360"/>');
    expect(pPrOf(parsed.paragraphs[1])).toContain('<w:ind w:left="1440" w:hanging="360"/>');
    expect(pPrOf(parsed.paragraphs[2])).toContain('<w:ind w:left="2160" w:hanging="360"/>');
  });

  test('later blocks of an item align with its text, without a checkbox, and keep the strike', async () => {
    const parsed = await convert(
      '<ul data-checklist="true"><li data-checked="true" data-strike="true"><p>First</p><p>Second</p></li></ul>'
    );

    assertParagraphCount(parsed, 2);
    expectCheckbox(parsed.paragraphs[0], CHECKED);
    const secondRuns = runsOf(parsed.paragraphs[1]);
    expect(secondRuns.map((run) => run.text)).toEqual(['Second']);
    expect(secondRuns[0].strike).toBe(true);
    expect(pPrOf(parsed.paragraphs[1])).toContain('<w:ind w:left="720" w:hanging="0"/>');
  });

  test('sizes the checkbox with the item font size', async () => {
    const parsed = await convert(
      '<ul data-checklist="true"><li style="font-size: 14px">Item</li></ul>'
    );

    const [glyphRun] = runsOf(parsed.paragraphs[0]);
    expect(glyphRun.text).toBe(UNCHECKED);
    expect(glyphRun.xml).toContain('<w:sz w:val="21"/>');
  });

  test('ignores an <li> margin-left so the checkbox indent is not duplicated', async () => {
    const parsed = await convert(
      '<ul data-checklist="true"><li style="margin-left: 40px">Item</li></ul>'
    );

    expectCheckbox(parsed.paragraphs[0], UNCHECKED);
    expect(pPrOf(parsed.paragraphs[0]).match(/<w:ind /g)).toHaveLength(1);
  });

  test('a bullet list inside a checklist item keeps bullet numbering', async () => {
    const parsed = await convert(
      '<ul data-checklist="true"><li>Task<ul><li>Note</li></ul></li></ul>'
    );

    expectCheckbox(parsed.paragraphs[0], UNCHECKED);
    expect(parsed.paragraphs[1].xml).toContain('<w:ilvl w:val="1"/>');
    expect(runsOf(parsed.paragraphs[1]).map((run) => run.text)).toEqual(['Note']);
  });

  test('a checklist nested in a bullet list is indented to its level', async () => {
    const parsed = await convert(
      '<ul><li>Bullet<ul data-checklist="true"><li data-checked="true">Task</li></ul></li></ul>'
    );

    expect(parsed.paragraphs[0].xml).toContain('<w:numPr>');
    expectCheckbox(parsed.paragraphs[1], CHECKED);
    expect(pPrOf(parsed.paragraphs[1])).toContain('<w:ind w:left="1440" w:hanging="360"/>');
  });

  test('data-checked on items of a regular <ul> does not make it a checklist', async () => {
    const parsed = await convert('<ul><li data-checked="true">Item</li></ul>');

    expect(parsed.paragraphs[0].xml).toContain('<w:numPr>');
    expect(runsOf(parsed.paragraphs[0]).map((run) => run.text)).toEqual(['Item']);
  });
});

describe('Checklist symbol font', () => {
  // Without a font table entry, LibreOffice falls back to a colour emoji font
  // for U+2611 when "Segoe UI Symbol" is not installed. The entry steers the
  // substitution to a sans text font that has all checkbox glyphs.
  test('registers the symbol font with a DejaVu Sans fallback in the font table', async () => {
    const parsed = await convert(
      '<ul data-checklist="true"><li data-checked="true">Done</li></ul>'
    );
    const fontTableXml = compact(await parsed.zip.file('word/fontTable.xml').async('string'));

    expect(fontTableXml.match(/<w:font w:name="Segoe UI Symbol">/g)).toHaveLength(1);
    expect(fontTableXml).toContain(
      '<w:font w:name="Segoe UI Symbol"><w:altName w:val="DejaVu Sans"/><w:family w:val="swiss"/><w:pitch w:val="variable"/></w:font>'
    );
  });

  test('does not add the symbol font to documents without checklists', async () => {
    const parsed = await convert('<ul><li>Item</li></ul>');
    const fontTableXml = await parsed.zip.file('word/fontTable.xml').async('string');

    expect(fontTableXml).not.toContain('Segoe UI Symbol');
  });
});
