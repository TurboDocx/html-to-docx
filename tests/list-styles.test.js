/**
 * List style tests: bullet glyphs for <ul list-style-type>, numbering
 * formats for <ol list-style-type> and multilevel "outline" numbering.
 *
 * Each <ul>/<ol> gets its own <w:abstractNum> in word/numbering.xml; a list
 * item paragraph references it with <w:numId> and its nesting depth with
 * <w:ilvl>.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX, assertParagraphCount } from './helpers/docx-assertions.js';

const convert = async (html) => {
  const docx = await HTMLtoDOCX(html, null, {});
  const parsed = await parseDOCX(docx);
  const numberingXml = await parsed.zip.file('word/numbering.xml').async('string');
  return { ...parsed, numberingXml };
};

const attributesOf = (elementXml) => {
  const attributes = {};
  (elementXml || '').replace(/w:(\w+)="([^"]*)"/g, (match, name, value) => {
    attributes[name] = value;
    return match;
  });
  return attributes;
};

// { numId, ilvl } of a list item paragraph.
const numberingOf = (paragraph) => ({
  numId: (paragraph.xml.match(/<w:numId w:val="(\d+)"/) || [])[1],
  ilvl: Number((paragraph.xml.match(/<w:ilvl w:val="(\d+)"/) || [])[1]),
});

// Level definitions (keyed by ilvl) of the abstractNum behind a numId.
const levelsOf = (numberingXml, numId) => {
  const num = numberingXml.match(
    new RegExp(`<w:num w:numId="${numId}">[\\s\\S]*?<w:abstractNumId w:val="(\\d+)"`)
  );
  expect(num).not.toBeNull();
  const abstractNum = numberingXml.match(
    new RegExp(`<w:abstractNum w:abstractNumId="${num[1]}">([\\s\\S]*?)</w:abstractNum>`)
  );
  expect(abstractNum).not.toBeNull();
  const levels = {};
  abstractNum[1].replace(/<w:lvl w:ilvl="(\d+)">([\s\S]*?)<\/w:lvl>/g, (match, ilvl, body) => {
    levels[ilvl] = {
      start: attributesOf((body.match(/<w:start [^>]*\/>/) || [])[0]).val,
      numFmt: attributesOf((body.match(/<w:numFmt [^>]*\/>/) || [])[0]).val,
      lvlText: attributesOf((body.match(/<w:lvlText [^>]*\/>/) || [])[0]).val,
      ind: attributesOf((body.match(/<w:ind [^>]*\/>/) || [])[0]),
      rFonts: attributesOf((body.match(/<w:rPr>\s*<w:rFonts [^>]*\/>\s*<\/w:rPr>/) || [])[0]),
    };
    return match;
  });
  expect(Object.keys(levels)).toHaveLength(9);
  return levels;
};

const levelOfParagraph = (parsed, paragraph) => {
  const { numId, ilvl } = numberingOf(paragraph);
  return levelsOf(parsed.numberingXml, numId)[ilvl];
};

describe('Bullet style per list (<ul list-style-type>)', () => {
  test.each([
    ['disc', '\u2022'],
    ['circle', '\u25E6'],
    ['square', '\u25AA'],
  ])('list-style-type: %s uses %s with a text font at every level', async (type, glyph) => {
    const parsed = await convert(`<ul style="list-style-type: ${type}"><li>Item</li></ul>`);
    const { numId } = numberingOf(parsed.paragraphs[0]);

    Object.values(levelsOf(parsed.numberingXml, numId)).forEach((level) => {
      expect(level.numFmt).toBe('bullet');
      expect(level.lvlText).toBe(glyph);
      expect(level.rFonts).toMatchObject({ ascii: 'Arial', hAnsi: 'Arial' });
    });
  });

  test('nested lists that declare the style keep the glyph at their level', async () => {
    const parsed = await convert(`
      <ul style="list-style-type: square">
        <li>Level 0
          <ul style="list-style-type: square">
            <li>Level 1
              <ul style="list-style-type: square"><li>Level 2</li></ul>
            </li>
          </ul>
        </li>
      </ul>
    `);

    assertParagraphCount(parsed, 3);
    parsed.paragraphs.forEach((paragraph, depth) => {
      expect(numberingOf(paragraph).ilvl).toBe(depth);
      expect(levelOfParagraph(parsed, paragraph).lvlText).toBe('\u25AA');
    });
  });

  test('accepts the value in any case', async () => {
    const parsed = await convert('<ul style="list-style-type: Circle"><li>Item</li></ul>');

    expect(levelOfParagraph(parsed, parsed.paragraphs[0]).lvlText).toBe('\u25E6');
  });

  test('a <ul> without list-style-type keeps the Symbol-font bullet', async () => {
    const parsed = await convert('<ul><li>Item<ul><li>Nested</li></ul></li></ul>');

    parsed.paragraphs.forEach((paragraph) => {
      const { numId } = numberingOf(paragraph);
      Object.values(levelsOf(parsed.numberingXml, numId)).forEach((level) => {
        expect(level.numFmt).toBe('bullet');
        expect(level.lvlText).toBe('\uF0B7');
        expect(level.rFonts).toEqual({ ascii: 'Symbol', hAnsi: 'Symbol', hint: 'default' });
      });
    });
  });

  test('an unsupported list-style-type on <ul> keeps the Symbol-font bullet', async () => {
    const parsed = await convert('<ul style="list-style-type: lower-roman"><li>Item</li></ul>');
    const level = levelOfParagraph(parsed, parsed.paragraphs[0]);

    expect(level.lvlText).toBe('\uF0B7');
    expect(level.rFonts.ascii).toBe('Symbol');
  });
});

describe('Bullet glyph per list (<ul data-bullet>)', () => {
  test.each([
    ['\u25CF', 'Arial'], // ●
    ['\u25CB', 'Arial'], // ○
    ['\u25A0', 'Arial'], // ■
    ['\u2756', 'DejaVu Sans'], // ❖
    ['\u27A2', 'DejaVu Sans'], // ➢
    ['\u274F', 'DejaVu Sans'], // ❏
    ['\u2794', 'DejaVu Sans'], // ➔
    ['\u25C6', 'DejaVu Sans'], // ◆
    ['\u2605', 'DejaVu Sans'], // ★
  ])('data-bullet %s draws that glyph in %s at every level', async (glyph, font) => {
    const parsed = await convert(`<ul data-bullet="${glyph}"><li>Item</li></ul>`);
    const { numId } = numberingOf(parsed.paragraphs[0]);

    Object.values(levelsOf(parsed.numberingXml, numId)).forEach((level) => {
      expect(level.numFmt).toBe('bullet');
      expect(level.lvlText).toBe(glyph);
      expect(level.rFonts).toMatchObject({ ascii: font, hAnsi: font, eastAsia: font, cs: font });
    });
  });

  test('data-bullet wins over list-style-type', async () => {
    const parsed = await convert(
      '<ul data-bullet="\u25A0" style="list-style-type: disc"><li>Item</li></ul>'
    );

    expect(levelOfParagraph(parsed, parsed.paragraphs[0]).lvlText).toBe('\u25A0');
  });

  test('a data-bullet that is not one glyph falls back to list-style-type', async () => {
    const parsed = await convert(
      '<ul data-bullet="ab" style="list-style-type: circle"><li>Item</li></ul>'
    );

    expect(levelOfParagraph(parsed, parsed.paragraphs[0]).lvlText).toBe('\u25E6');
  });

  test('nested lists each draw their own glyph at their own level', async () => {
    const parsed = await convert(`
      <ul data-bullet="\u2756">
        <li>Level 0
          <ul data-bullet="\u27A2">
            <li>Level 1
              <ul data-bullet="\u25A0"><li>Level 2</li></ul>
            </li>
          </ul>
        </li>
      </ul>
    `);

    assertParagraphCount(parsed, 3);
    expect(
      parsed.paragraphs.map((paragraph) => levelOfParagraph(parsed, paragraph).lvlText)
    ).toEqual(['\u2756', '\u27A2', '\u25A0']);
  });
});

describe('Numbering formats (<ol list-style-type>)', () => {
  test.each([
    ['decimal', 'decimal'],
    ['decimal-leading-zero', 'decimalZero'],
    ['upper-roman', 'upperRoman'],
    ['lower-roman', 'lowerRoman'],
    ['upper-alpha', 'upperLetter'],
    ['lower-alpha', 'lowerLetter'],
  ])('list-style-type: %s uses numFmt %s at every level of each nested list', async (type, fmt) => {
    const parsed = await convert(`
      <ol style="list-style-type: ${type}">
        <li>One
          <ol style="list-style-type: ${type}">
            <li>One.one
              <ol style="list-style-type: ${type}"><li>One.one.one</li></ol>
            </li>
          </ol>
        </li>
        <li>Two</li>
      </ol>
    `);

    assertParagraphCount(parsed, 4);
    parsed.paragraphs.forEach((paragraph) => {
      const { numId, ilvl } = numberingOf(paragraph);
      const levels = levelsOf(parsed.numberingXml, numId);
      Object.values(levels).forEach((level) => expect(level.numFmt).toBe(fmt));
      expect(levels[ilvl].lvlText).toBe(`%${ilvl + 1}.`);
    });
    expect(parsed.paragraphs.map((paragraph) => numberingOf(paragraph).ilvl)).toEqual([0, 1, 2, 0]);
  });
});

describe('Zero-padded numbering (<ol list-style-type: decimal-leading-zero>)', () => {
  test('hangs "01." as far out as an outline "1.1.", so it clears its text', async () => {
    const parsed = await convert(
      '<ol style="list-style-type: decimal-leading-zero"><li>One</li></ol>'
    );
    const levels = levelsOf(parsed.numberingXml, numberingOf(parsed.paragraphs[0]).numId);

    expect(levels[0].ind).toEqual({ left: '720', hanging: '540' });
    expect(levels[1].ind).toEqual({ left: '1440', hanging: '540' });
  });
});

describe('Count suffix (<ol data-suffix>)', () => {
  test('data-suffix=")" closes each count with a bracket', async () => {
    const parsed = await convert(
      '<ol data-suffix=")" style="list-style-type: lower-alpha"><li>a</li><li>b</li></ol>'
    );
    const levels = levelsOf(parsed.numberingXml, numberingOf(parsed.paragraphs[0]).numId);

    expect(levels[0]).toMatchObject({ numFmt: 'lowerLetter', lvlText: '%1)' });
    expect(levels[3].lvlText).toBe('%4)');
  });

  test('any other data-suffix keeps the full stop', async () => {
    const parsed = await convert(
      '<ol data-suffix="]" style="list-style-type: decimal"><li>1</li></ol>'
    );

    expect(levelOfParagraph(parsed, parsed.paragraphs[0]).lvlText).toBe('%1.');
  });

  test('a Google Docs "1) a) i)" list numbers each level in its own format', async () => {
    const parsed = await convert(`
      <ol data-suffix=")" style="list-style-type: decimal">
        <li>One
          <ol data-suffix=")" style="list-style-type: lower-alpha">
            <li>a
              <ol data-suffix=")" style="list-style-type: lower-roman"><li>i</li></ol>
            </li>
          </ol>
        </li>
      </ol>
    `);

    expect(
      parsed.paragraphs.map((paragraph) => {
        const { numFmt, lvlText } = levelOfParagraph(parsed, paragraph);
        return `${numFmt} ${lvlText}`;
      })
    ).toEqual(['decimal %1)', 'lowerLetter %2)', 'lowerRoman %3)']);
  });
});

describe('Outline numbering (<ol data-numbering="outline">)', () => {
  const outlineHtml = `
    <ol style="list-style-type: decimal" data-numbering="outline">
      <li>A
        <ol style="list-style-type: decimal" data-numbering="outline">
          <li>A.1
            <ol style="list-style-type: decimal" data-numbering="outline"><li>A.1.1</li></ol>
          </li>
          <li>A.2</li>
        </ol>
      </li>
      <li>B
        <ol style="list-style-type: decimal" data-numbering="outline"><li>B.1</li></ol>
      </li>
    </ol>
  `;

  test('builds multilevel decimal level text %1. / %1.%2. / %1.%2.%3.', async () => {
    const parsed = await convert(outlineHtml);
    const levels = levelsOf(parsed.numberingXml, numberingOf(parsed.paragraphs[0]).numId);

    expect(levels[0].lvlText).toBe('%1.');
    expect(levels[1].lvlText).toBe('%1.%2.');
    expect(levels[2].lvlText).toBe('%1.%2.%3.');
    expect(levels[8].lvlText).toBe('%1.%2.%3.%4.%5.%6.%7.%8.%9.');
    Object.values(levels).forEach((level) => {
      expect(level.numFmt).toBe('decimal');
      expect(level.start).toBe('1');
    });
  });

  test('nested outline lists share one numbering definition so counters continue', async () => {
    const parsed = await convert(outlineHtml);

    assertParagraphCount(parsed, 6);
    const numbering = parsed.paragraphs.map(numberingOf);
    expect(new Set(numbering.map(({ numId }) => numId)).size).toBe(1);
    expect(numbering.map(({ ilvl }) => ilvl)).toEqual([0, 1, 2, 1, 0, 1]);
    expect(parsed.numberingXml.match(/<w:abstractNum /g)).toHaveLength(1);
  });

  test('widens the hanging indent at deeper levels to fit the longer numbers', async () => {
    const parsed = await convert(outlineHtml);
    const levels = levelsOf(parsed.numberingXml, numberingOf(parsed.paragraphs[0]).numId);

    expect(levels[0].ind).toEqual({ left: '720', hanging: '360' });
    expect(levels[1].ind).toEqual({ left: '1440', hanging: '540' });
    expect(levels[2].ind).toEqual({ left: '2160', hanging: '720' });
  });

  test('a nested <ol> without its own numbering attributes joins the outline', async () => {
    const parsed = await convert(`
      <ol data-numbering="outline"><li>A<ol><li>A.1</li></ol></li></ol>
    `);
    const [first, second] = parsed.paragraphs.map(numberingOf);

    expect(second.numId).toBe(first.numId);
    expect(second.ilvl).toBe(1);
  });

  test('data-start applies to the first outline level only', async () => {
    const parsed = await convert(`
      <ol data-numbering="outline" data-start="3"><li>C<ol data-numbering="outline"><li>C.1</li></ol></li></ol>
    `);
    const levels = levelsOf(parsed.numberingXml, numberingOf(parsed.paragraphs[0]).numId);

    expect(levels[0].start).toBe('3');
    expect(levels[1].start).toBe('1');
  });

  test('an outline list nested in a bullet list numbers from its own level', async () => {
    const parsed = await convert(`
      <ul><li>Bullet
        <ol data-numbering="outline"><li>One<ol data-numbering="outline"><li>One.one</li></ol></li></ol>
      </li></ul>
    `);
    const [, outlineItem, nestedOutlineItem] = parsed.paragraphs.map(numberingOf);
    const levels = levelsOf(parsed.numberingXml, outlineItem.numId);

    expect(nestedOutlineItem.numId).toBe(outlineItem.numId);
    expect([outlineItem.ilvl, nestedOutlineItem.ilvl]).toEqual([1, 2]);
    expect(levels[1].lvlText).toBe('%2.');
    expect(levels[2].lvlText).toBe('%2.%3.');
    expect(levels[1].ind).toEqual({ left: '1440', hanging: '360' });
  });

  test('a bullet list inside an outline item stays a separate bullet list', async () => {
    const parsed = await convert(`
      <ol data-numbering="outline"><li>A
        <ul><li>Bullet<ol><li>Under bullet</li></ol></li></ul>
      </li></ol>
    `);
    const [outlineItem, bulletItem, orderedItem] = parsed.paragraphs.map(numberingOf);

    expect(bulletItem.numId).not.toBe(outlineItem.numId);
    expect(orderedItem.numId).not.toBe(outlineItem.numId);
    expect(levelsOf(parsed.numberingXml, orderedItem.numId)[2].lvlText).toBe('%3.');
  });

  test('two sibling outline lists get separate numbering definitions', async () => {
    const parsed = await convert(`
      <ol data-numbering="outline"><li>First list</li></ol>
      <ol data-numbering="outline"><li>Second list</li></ol>
    `);
    const [first, second] = parsed.paragraphs.map(numberingOf);

    expect(second.numId).not.toBe(first.numId);
  });

  test('a nested <ol> with a different numbering keeps its own definition', async () => {
    const parsed = await convert(`
      <ol data-numbering="outline"><li>A<ol style="list-style-type: lower-alpha"><li>a</li></ol></li></ol>
    `);
    const [outlineItem, nestedItem] = parsed.paragraphs.map(numberingOf);

    expect(nestedItem.numId).not.toBe(outlineItem.numId);
    expect(levelsOf(parsed.numberingXml, nestedItem.numId)[1].numFmt).toBe('lowerLetter');
  });
});
