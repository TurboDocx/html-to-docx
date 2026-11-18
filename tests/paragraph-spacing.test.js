/**
 * Paragraph spacing tests: CSS vertical margins and line-height mapped to
 * <w:spacing> on paragraph-level elements (<p>, <h1>-<h6>, <li>).
 *
 * Units: 1px = 15 twips, 1pt = 20 twips.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphCount } from './helpers/docx-assertions.js';

const SPACING_ELEMENT_REGEX = /<w:spacing\b[^>]*\/>/g;

const spacingOf = (paragraph) => {
  const elements = paragraph.xml.match(SPACING_ELEMENT_REGEX) || [];
  expect(elements).toHaveLength(1);
  const attributes = {};
  elements[0].replace(/w:(\w+)="([^"]*)"/g, (match, name, value) => {
    attributes[name] = value;
    return match;
  });
  return attributes;
};

const convert = async (html, options = {}) => {
  const docx = await HTMLtoDOCX(html, null, options);
  return parseDOCX(docx);
};

describe('Paragraph spacing before (margin-top)', () => {
  test('maps margin-top in px on <p> to w:before', async () => {
    const parsed = await convert('<p style="margin-top: 12px">Text</p>');

    expect(spacingOf(parsed.paragraphs[0]).before).toBe('180');
  });

  test('maps margin-top in pt on <p> to w:before', async () => {
    const parsed = await convert('<p style="margin-top: 10pt">Text</p>');

    expect(spacingOf(parsed.paragraphs[0]).before).toBe('200');
  });

  test('combines margin-top, margin-bottom and line-height in one w:spacing element', async () => {
    const parsed = await convert(
      '<p style="margin-top: 12px; margin-bottom: 8px; line-height: 1.5">Text</p>'
    );

    expect(spacingOf(parsed.paragraphs[0])).toEqual({
      before: '180',
      after: '120',
      line: '360',
      lineRule: 'auto',
    });
  });

  test.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])(
    'maps margin-top and margin-bottom on <%s> while keeping the heading style',
    async (tag) => {
      const parsed = await convert(
        `<${tag} style="margin-top: 16px; margin-bottom: 4px">Heading</${tag}>`
      );
      const [paragraph] = parsed.paragraphs;

      expect(paragraph.xml).toContain(`<w:pStyle w:val="Heading${tag[1]}"/>`);
      expect(spacingOf(paragraph)).toMatchObject({ before: '240', after: '60' });
    }
  );

  test('maps margin-top and margin-bottom declared on an <li>', async () => {
    const parsed = await convert(
      '<ul><li style="margin-top: 6px; margin-bottom: 3px">Item</li></ul>'
    );
    const [paragraph] = parsed.paragraphs;

    expect(paragraph.xml).toContain('<w:numPr>');
    expect(spacingOf(paragraph)).toMatchObject({ before: '90', after: '45' });
  });

  test('applies an <li> margin-top to the <p> blocks inside it', async () => {
    const parsed = await convert('<ol><li style="margin-top: 4pt"><p>Block</p></li></ol>');

    expect(spacingOf(parsed.paragraphs[0]).before).toBe('80');
  });

  test('does not copy a <ul>/<ol> margin-top onto every list item', async () => {
    const parsed = await convert('<ol style="margin-top: 20px"><li>One</li><li>Two</li></ol>');

    assertParagraphCount(parsed, 2);
    parsed.paragraphs.forEach((paragraph) => {
      expect(spacingOf(paragraph).before).toBeUndefined();
    });
  });

  test('does not copy a <ul> margin-top onto <p> blocks inside its items', async () => {
    const parsed = await convert('<ul style="margin-top: 20px"><li><p>Block</p></li></ul>');

    expect(spacingOf(parsed.paragraphs[0]).before).toBeUndefined();
  });

  test('treats a unitless zero margin-top as zero spacing', async () => {
    const parsed = await convert('<p style="margin-top: 0">Text</p>');

    expect(spacingOf(parsed.paragraphs[0]).before).toBe('0');
  });

  test.each(['-5px', 'auto', '1.5em', '10%'])(
    'ignores margin-top values it cannot represent (%s)',
    async (value) => {
      const parsed = await convert(`<p style="margin-top: ${value}">Text</p>`);

      expect(spacingOf(parsed.paragraphs[0]).before).toBeUndefined();
    }
  );

  test('ignores margin-top on elements that are not paragraph-level', async () => {
    const parsed = await convert('<p><span style="margin-top: 30px">Inline</span></p>');

    expect(spacingOf(parsed.paragraphs[0]).before).toBeUndefined();
  });
});

describe('Paragraph spacing backward compatibility', () => {
  test('margin-bottom on <p> still maps to w:after without a w:before', async () => {
    const parsed = await convert('<p style="margin-bottom: 8px">Text</p>');

    expect(spacingOf(parsed.paragraphs[0])).toEqual({ after: '120', lineRule: 'auto' });
  });

  test('margin shorthand keeps mapping only its bottom value to w:after', async () => {
    const parsed = await convert('<p style="margin: 12pt 0 6pt 0">Text</p>');

    expect(spacingOf(parsed.paragraphs[0])).toEqual({ after: '120', lineRule: 'auto' });
  });

  test('a <ul> margin-bottom still reaches <p> blocks inside its items', async () => {
    const parsed = await convert('<ul style="margin-bottom: 0in"><li><p>P1</p><p>P2</p></li></ul>');

    assertParagraphCount(parsed, 2);
    parsed.paragraphs.forEach((paragraph) => {
      expect(spacingOf(paragraph).after).toBe('0');
    });
  });

  test('a <ol> margin-bottom still reaches its items as before', async () => {
    const parsed = await convert('<ol style="margin-bottom: 20px"><li>One</li><li>Two</li></ol>');

    assertParagraphCount(parsed, 2);
    parsed.paragraphs.forEach((paragraph) => {
      expect(spacingOf(paragraph).after).toBe('300');
    });
  });

  test('a paragraph without margins emits no before/after', async () => {
    const parsed = await convert('<p>Text</p>');

    expect(spacingOf(parsed.paragraphs[0])).toEqual({ lineRule: 'auto' });
  });
});

describe('Line spacing (line-height)', () => {
  test.each([
    ['22.5px', '338'],
    ['24px', '360'],
    ['18pt', '360'],
    ['0.5in', '720'],
  ])('maps absolute line-height %s to an at-least line of %s twips', async (value, twips) => {
    const parsed = await convert(`<p style="line-height: ${value}">Text</p>`);

    expect(spacingOf(parsed.paragraphs[0])).toEqual({ line: twips, lineRule: 'atLeast' });
  });

  test('combines absolute line-height with margins in one w:spacing element', async () => {
    const parsed = await convert(
      '<h3 style="margin-top: 12px; margin-bottom: 6px; line-height: 20px">Heading</h3>'
    );

    expect(spacingOf(parsed.paragraphs[0])).toEqual({
      line: '300',
      before: '180',
      after: '90',
      lineRule: 'atLeast',
    });
  });

  test('maps absolute line-height on list items', async () => {
    const parsed = await convert('<ol><li style="line-height: 21px">Item</li></ol>');

    expect(spacingOf(parsed.paragraphs[0])).toMatchObject({ line: '315', lineRule: 'atLeast' });
  });

  test('keeps unitless line-height as a multiple of a single line (lineRule auto)', async () => {
    const parsed = await convert('<p style="line-height: 1.5">Text</p>');

    expect(spacingOf(parsed.paragraphs[0])).toEqual({ line: '360', lineRule: 'auto' });
  });

  test('keeps unitless line-height combined with font-size unchanged', async () => {
    const parsed = await convert('<p style="font-size: 12pt; line-height: 1.5">Text</p>');

    expect(spacingOf(parsed.paragraphs[0])).toEqual({ line: '360', lineRule: 'auto' });
  });

  test('a unitless line-height on a paragraph overrides an absolute one from its table cell', async () => {
    const parsed = await convert(
      '<table><tr><td style="line-height: 20px"><p style="line-height: 1.5">Cell</p></td></tr></table>'
    );
    const paragraph = parsed.paragraphs.find((p) => p.text === 'Cell');

    expect(spacingOf(paragraph)).toEqual({ line: '360', lineRule: 'auto' });
  });

  test('absolute line-height on one paragraph does not affect the next', async () => {
    const parsed = await convert(
      '<p style="line-height: 20px">First</p><p style="line-height: 1.15">Second</p>'
    );

    expect(spacingOf(parsed.paragraphs[0])).toEqual({ line: '300', lineRule: 'atLeast' });
    expect(spacingOf(parsed.paragraphs[1])).toEqual({ line: '276', lineRule: 'auto' });
  });
});
