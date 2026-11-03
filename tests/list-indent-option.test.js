/**
 * A document's list indents, when it names its own.
 *
 * The converter indents each list level 720 twips (0.5in) with its marker 360
 * before the text — Word's defaults, which customers' documents keep. The
 * document editor draws a level 45px further in, its marker 20px into a 45px
 * column: 675 twips a level, the marker 375 before the text. Its download said
 * Word's, so every list's text sat 3px right of the editor's at the first
 * level and 6px at the second (2026-11-03). `numbering` names them.
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const LISTS =
  '<ul><li>a<ul><li>b</li></ul></li></ul>' +
  '<ol><li>one</li></ol>' +
  '<ul data-checklist="true"><li data-checked="false">c</li></ul>';

const levelIndents = (numbering) =>
  [...numbering.matchAll(/<w:lvl w:ilvl="(\d)"[\s\S]*?<\/w:lvl>/g)]
    .filter((m) => Number(m[1]) < 2)
    .map((m) => ({
      level: Number(m[1]),
      tab: m[0].match(/<w:tab w:val="num" w:pos="(\d+)"/)?.[1],
      left: m[0].match(/<w:ind w:left="(\d+)"/)?.[1],
      hanging: m[0].match(/w:hanging="(\d+)"/)?.[1],
    }));

describe('list indents', () => {
  test("keep Word's when the document names none", async () => {
    const parsed = await parseDOCX(await HTMLtoDOCX(LISTS, null, {}));
    const indents = levelIndents(await parsed.zip.file('word/numbering.xml').async('string'));

    expect(indents).toContainEqual({ level: 0, tab: '720', left: '720', hanging: '360' });
    expect(indents).toContainEqual({ level: 1, tab: '1440', left: '1440', hanging: '360' });
  });

  test('are the ones the document names, a level at a time', async () => {
    const parsed = await parseDOCX(
      await HTMLtoDOCX(LISTS, null, { numbering: { levelIndent: 675, hangingIndent: 375 } })
    );
    const indents = levelIndents(await parsed.zip.file('word/numbering.xml').async('string'));

    expect(indents).toContainEqual({ level: 0, tab: '675', left: '675', hanging: '375' });
    expect(indents).toContainEqual({ level: 1, tab: '1350', left: '1350', hanging: '375' });
    expect(indents.some((indent) => indent.left === '720')).toBe(false);
  });

  test('hold a checklist item where a list item stands', async () => {
    const { xml } = await parseDOCX(
      await HTMLtoDOCX(LISTS, null, { numbering: { levelIndent: 675, hangingIndent: 375 } })
    );
    const item = xml.slice(xml.lastIndexOf('<w:p>', xml.indexOf('>c<')), xml.indexOf('>c<'));

    expect(item).toContain('<w:ind w:left="675" w:hanging="375"/>');
    expect(item).toContain('<w:tab w:val="left" w:pos="675"/>');
  });
});
