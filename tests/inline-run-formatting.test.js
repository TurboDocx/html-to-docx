/**
 * Inline run formatting tests for editor output:
 * - background-color on a <span> becomes run shading (<w:shd>)
 * - explicit span formatting inside <h1>-<h6> is emitted as direct run
 *   formatting, which takes precedence over the HeadingN paragraph style
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const convert = async (html, options = {}) => {
  const docx = await HTMLtoDOCX(html, null, options);
  return parseDOCX(docx);
};

// Drop pretty-print indentation between tags, keeping whitespace-only text.
const compact = (xml) => xml.replace(/>\n\s*</g, '><');

// Runs of all paragraphs: { rPr, text }.
const runsOf = (parsed) =>
  parsed.paragraphs.flatMap((paragraph) =>
    (compact(paragraph.xml).match(/<w:r>[\s\S]*?<\/w:r>/g) || []).map((runXml) => ({
      rPr: (runXml.match(/<w:rPr\/>|<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0],
      text: (runXml.match(/<w:t [^>]*>([^<]*)<\/w:t>/) || [])[1],
    }))
  );

const runWithText = (parsed, text) => {
  const run = runsOf(parsed).find((candidate) => candidate.text === text);
  expect(run).toBeDefined();
  return run;
};

describe('Highlight (background-color on spans)', () => {
  test.each([
    ['#ffff00', 'ffff00'],
    ['#FFF200', 'FFF200'],
    ['#ff0', 'ffff00'],
    ['rgb(255, 242, 0)', 'fff200'],
    ['yellow', 'ffff00'],
  ])('maps background-color %s to <w:shd w:fill="%s">', async (color, fill) => {
    const parsed = await convert(
      `<p>Plain <span style="background-color: ${color}">marked</span></p>`
    );

    expect(runWithText(parsed, 'marked').rPr).toContain(`<w:shd w:val="clear" w:fill="${fill}"/>`);
    expect(runWithText(parsed, 'Plain ').rPr).not.toContain('<w:shd');
  });

  test('emits no shading for a transparent background', async () => {
    const parsed = await convert('<p><span style="background-color: transparent">text</span></p>');

    expect(runWithText(parsed, 'text').rPr).not.toContain('<w:shd');
  });

  test('keeps shading after color and size in the run properties', async () => {
    const parsed = await convert(
      '<p><span style="background-color: #ffff00; color: #ff0000; font-size: 14px">text</span></p>'
    );

    expect(runWithText(parsed, 'text').rPr).toBe(
      '<w:rPr><w:color w:val="ff0000"/><w:sz w:val="21"/><w:shd w:val="clear" w:fill="ffff00"/></w:rPr>'
    );
  });

  test('combines shading with bold, italic, underline and strike', async () => {
    const parsed = await convert(
      '<p><span style="background-color: #00ffff"><strong><em><u><s>all</s></u></em></strong></span></p>'
    );
    const { rPr } = runWithText(parsed, 'all');

    ['<w:b/>', '<w:i/>', '<w:strike w:val="true"/>', '<w:u w:val="single"/>'].forEach((element) =>
      expect(rPr).toContain(element)
    );
    expect(rPr).toContain('<w:shd w:val="clear" w:fill="00ffff"/>');
  });
});

describe('Explicit inline formatting inside headings', () => {
  test.each(['h1', 'h2', 'h3', 'h4', 'h5'])(
    'keeps span font-size, font-weight and color as direct run formatting in <%s>',
    async (tag) => {
      const parsed = await convert(
        `<${tag}><span style="font-size: 28px; font-weight: bold; color: #ff0000">Title</span></${tag}>`
      );

      expect(parsed.paragraphs[0].xml).toContain(`<w:pStyle w:val="Heading${tag[1]}"/>`);
      expect(runWithText(parsed, 'Title').rPr).toBe(
        '<w:rPr><w:b/><w:color w:val="ff0000"/><w:sz w:val="42"/></w:rPr>'
      );
    }
  );

  test('a smaller explicit size than the heading style is kept', async () => {
    const parsed = await convert('<h1><span style="font-size: 12px">small</span></h1>');

    expect(runWithText(parsed, 'small').rPr).toBe('<w:rPr><w:sz w:val="18"/></w:rPr>');
  });

  test('each span in a heading keeps its own formatting', async () => {
    const parsed = await convert(
      '<h2><span style="font-size: 20px">Big</span> <span style="color: #00aa00">green</span> <strong>strong</strong></h2>'
    );

    expect(runWithText(parsed, 'Big').rPr).toBe('<w:rPr><w:sz w:val="30"/></w:rPr>');
    expect(runWithText(parsed, 'green').rPr).toBe('<w:rPr><w:color w:val="00aa00"/></w:rPr>');
    expect(runWithText(parsed, 'strong').rPr).toBe('<w:rPr><w:b/></w:rPr>');
  });

  test('span color overrides a color set on the heading element', async () => {
    const parsed = await convert(
      '<h3 style="color: #0000ff">Blue <span style="color: #ff0000">red</span></h3>'
    );

    expect(runWithText(parsed, 'Blue ').rPr).toContain('<w:color w:val="0000ff"/>');
    expect(runWithText(parsed, 'red').rPr).toContain('<w:color w:val="ff0000"/>');
    expect(runWithText(parsed, 'red').rPr).not.toContain('0000ff');
  });

  test('with non-bold heading styles, bold comes only from the explicit span formatting', async () => {
    const parsed = await convert(
      '<h1><span style="font-weight: bold">Bold</span> <span>Regular</span></h1>',
      { heading: { heading1: { bold: false } } }
    );
    const stylesXml = await parsed.zip.file('word/styles.xml').async('string');
    const heading1Style = stylesXml.match(/<w:style [^>]*w:styleId="Heading1">[\s\S]*?<\/w:style>/);

    expect(heading1Style[0]).not.toContain('<w:b />');
    expect(runWithText(parsed, 'Bold').rPr).toBe('<w:rPr><w:b/></w:rPr>');
    expect(runWithText(parsed, 'Regular').rPr).not.toContain('<w:b/>');
  });
});
