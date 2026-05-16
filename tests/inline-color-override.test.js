/**
 * Inline color override tests (issue #200).
 *
 * When a paragraph (or any block element) has an inline `color` style AND an
 * inline element inside it (<strong>, <em>, <u>, <a>, <span>) also has its
 * own inline `color`, the child's color must win for the corresponding run.
 *
 * The pre-fix behavior was that the parent's color silently "won" for the
 * child's run, dropping the inline override. Legal documents authored in
 * tools that highlight key phrases via <strong style="color: #..."> were the
 * primary motivator (e.g. "WHEREFORE,", "NOW THEREFORE,").
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

function findRunsWithText(xml, needle) {
  const re = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
  const runs = [];
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[1].includes(needle)) runs.push(m[1]);
  }
  return runs;
}

function extractColor(runInner) {
  const m = runInner.match(/<w:color w:val="([^"]+)"/);
  return m ? m[1].toLowerCase() : null;
}

describe('Inline color override on inline elements (issue #200)', () => {
  test('<strong style="color: #4477c6"> overrides ancestor <p style="color: #000000">', async () => {
    const html =
      '<p style="font-size: 14pt; color: #000000;">' +
      '<strong style="color: #4477c6;">WHEREFORE, </strong>' +
      'rest of paragraph.</p>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);

    const wherefore = findRunsWithText(xml, 'WHEREFORE,')[0];
    const rest = findRunsWithText(xml, 'rest of paragraph')[0];
    expect(wherefore).toBeDefined();
    expect(rest).toBeDefined();

    expect(extractColor(wherefore)).toBe('4477c6');
    expect(extractColor(rest)).toBe('000000');
    // The strong's bold must still apply
    expect(wherefore).toContain('<w:b/>');
  });

  test('<em style="color: red"> overrides ancestor color', async () => {
    const html =
      '<p style="color: #000000;"><em style="color: #ff0000;">italicRed</em> trailing</p>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);
    const run = findRunsWithText(xml, 'italicRed')[0];
    expect(extractColor(run)).toBe('ff0000');
    expect(run).toContain('<w:i/>');
  });

  test('<u style="color: green"> overrides ancestor color', async () => {
    const html =
      '<p style="color: #000000;"><u style="color: #00aa00;">undGreen</u> trailing</p>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);
    const run = findRunsWithText(xml, 'undGreen')[0];
    expect(extractColor(run)).toBe('00aa00');
  });

  test('<span style="color: blue"> nested directly in a colored paragraph overrides', async () => {
    const html =
      '<p style="color: #000000;"><span style="color: #0000ff;">spanBlue</span> trailing</p>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);
    const run = findRunsWithText(xml, 'spanBlue')[0];
    expect(extractColor(run)).toBe('0000ff');
  });

  test('nested <strong style="color: orange"><em style="color: purple"> uses the innermost color', async () => {
    const html =
      '<p style="color: #000000;">' +
      '<strong style="color: #ff8800;">' +
      '<em style="color: #aa00ff;">innerPurple</em>' +
      ' boldOrange' +
      '</strong></p>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);

    const innerRun = findRunsWithText(xml, 'innerPurple')[0];
    expect(extractColor(innerRun)).toBe('aa00ff');
    // Bold and italic both apply
    expect(innerRun).toContain('<w:b/>');
    expect(innerRun).toContain('<w:i/>');

    const outerRun = findRunsWithText(xml, 'boldOrange')[0];
    expect(extractColor(outerRun)).toBe('ff8800');
    expect(outerRun).toContain('<w:b/>');
  });

  test('child element with no color inherits the parent color', async () => {
    // Pin existing inheritance so the fix does not regress it.
    const html =
      '<p style="color: #4477c6;"><strong>BoldNoOwnColor</strong> trailing</p>';
    const buf = await HTMLtoDOCX(html, null, { deterministicIds: true });
    const { xml } = await parseDOCX(buf);
    const run = findRunsWithText(xml, 'BoldNoOwnColor')[0];
    expect(extractColor(run)).toBe('4477c6');
    expect(run).toContain('<w:b/>');
  });
});
