/**
 * Tab character tests: a tab inside HTML text becomes <w:tab/> between text
 * elements of the same run, instead of a literal tab inside <w:t>.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphText } from './helpers/docx-assertions.js';

const convert = async (html, options = {}) => {
  const docx = await HTMLtoDOCX(html, null, options);
  return parseDOCX(docx);
};

// Drop pretty-print indentation between tags, keeping whitespace-only text.
const compact = (xml) => xml.replace(/>\n\s*</g, '><');

const runsOf = (paragraph) => compact(paragraph.xml).match(/<w:r>[\s\S]*?<\/w:r>/g) || [];

// Sequence of text/tab content in a run: ['a', TAB, 'b'].
const TAB = '<tab>';
const contentOf = (runXml) =>
  (runXml.match(/<w:t [^>]*>[^<]*<\/w:t>|<w:tab\/>/g) || []).map((element) =>
    element === '<w:tab/>' ? TAB : element.replace(/<[^>]+>/g, '')
  );

const expectNoLiteralTabs = (parsed) => {
  expect(parsed.xml).not.toMatch(/<w:t [^>]*>[^<]*\t[^<]*<\/w:t>/);
};

describe('Tab characters', () => {
  test('splits a raw tab into <w:tab/> within the same run', async () => {
    const parsed = await convert('<p>a\tb</p>');
    const runs = runsOf(parsed.paragraphs[0]);

    expect(runs).toHaveLength(1);
    expect(contentOf(runs[0])).toEqual(['a', TAB, 'b']);
    assertParagraphText(parsed, 0, 'ab');
    expectNoLiteralTabs(parsed);
  });

  test('handles &#9; entities, consecutive tabs and several tabs in one text', async () => {
    const parsed = await convert('<p>a&#9;b&#9;&#9;c</p>');

    expect(contentOf(runsOf(parsed.paragraphs[0])[0])).toEqual(['a', TAB, 'b', TAB, TAB, 'c']);
    expectNoLiteralTabs(parsed);
  });

  test('handles leading and trailing tabs without empty text elements', async () => {
    const parsed = await convert('<p>&#9;Indented&#9;</p>');
    const [run] = runsOf(parsed.paragraphs[0]);

    expect(contentOf(run)).toEqual([TAB, 'Indented', TAB]);
    expect(run).not.toMatch(/<w:t [^>]*><\/w:t>|<w:t [^>]*\/>/);
  });

  test('splits tabs when HTML minification is skipped', async () => {
    const parsed = await convert('<p>Name:\tValue</p>', {
      preprocessing: { skipHTMLMinify: true },
    });

    expect(contentOf(runsOf(parsed.paragraphs[0])[0])).toEqual(['Name:', TAB, 'Value']);
    expectNoLiteralTabs(parsed);
  });

  test('keeps run formatting around tabs in inline elements', async () => {
    const parsed = await convert(
      '<p><strong>Bold&#9;text</strong> and <span style="color: #ff0000">red&#9;span</span></p>'
    );
    const runs = runsOf(parsed.paragraphs[0]);
    const boldRun = runs.find((run) => run.includes('<w:b/>'));
    const redRun = runs.find((run) => run.includes('w:val="ff0000"'));

    expect(contentOf(boldRun)).toEqual(['Bold', TAB, 'text']);
    expect(contentOf(redRun)).toEqual(['red', TAB, 'span']);
  });

  test('splits tabs in headings, list items and hyperlinks', async () => {
    const parsed = await convert(
      '<h2>Title&#9;2</h2><ul><li>Item&#9;1</li></ul><p><a href="https://example.com">Link&#9;text</a></p>'
    );

    expect(contentOf(runsOf(parsed.paragraphs[0])[0])).toEqual(['Title', TAB, '2']);
    expect(contentOf(runsOf(parsed.paragraphs[1])[0])).toEqual(['Item', TAB, '1']);
    expect(contentOf(runsOf(parsed.paragraphs[2])[0])).toEqual(['Link', TAB, 'text']);
    expectNoLiteralTabs(parsed);
  });

  test('applies text-transform to the text around tabs', async () => {
    const parsed = await convert('<p style="text-transform: uppercase">left&#9;right</p>');

    expect(contentOf(runsOf(parsed.paragraphs[0])[0])).toEqual(['LEFT', TAB, 'RIGHT']);
  });

  test('text without tabs keeps a single text element', async () => {
    const parsed = await convert('<p>No tabs here</p>');
    const [run] = runsOf(parsed.paragraphs[0]);

    expect(run).toBe('<w:r><w:rPr/><w:t xml:space="preserve">No tabs here</w:t></w:r>');
  });
});
