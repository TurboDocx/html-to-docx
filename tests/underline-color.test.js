/**
 * An underline's colour.
 *
 * In CSS an underline is drawn in the text's colour unless
 * text-decoration-color says otherwise; Word's is the text's colour when <w:u>
 * names none (auto). The converter named black whenever the CSS named nothing,
 * so white header text came out with a black line under it — invisible on a
 * navy header — and red text with a black line (found 2026-11-03).
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

const underlines = async (html) => {
  const { xml } = await parseDOCX(await HTMLtoDOCX(html, {}));
  return [...xml.matchAll(/<w:u\b[^>]*\/>/g)].map((m) => m[0]);
};

describe('underline colour', () => {
  test('an underline the CSS gives no colour is drawn in the text colour', async () => {
    const found = await underlines(
      '<p><span style="color: #FFFFFF; text-decoration: underline">A1</span></p>'
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toContain('w:val="single"');
    expect(found[0]).not.toContain('w:color');
  });

  test('underline and strike-through together name no colour either', async () => {
    const found = await underlines(
      '<p><span style="color: #C0392B; text-decoration: underline line-through">both</span></p>'
    );
    expect(found).toHaveLength(1);
    expect(found[0]).not.toContain('w:color');
  });

  test('a colour the CSS names is kept', async () => {
    const found = await underlines(
      '<p><span style="text-decoration: underline; text-decoration-color: #2E86C1">blue line</span></p>'
    );
    expect(found).toHaveLength(1);
    expect(found[0]).toContain('w:color="2E86C1"');
  });
});
