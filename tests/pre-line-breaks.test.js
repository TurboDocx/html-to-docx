/**
 * Line breaks inside <pre>
 *
 * Related issue: https://github.com/TurboDocx/html-to-docx/issues/252
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

describe('<pre> line breaks', () => {
  test('writes each newline as <w:br/> instead of a raw line feed', async () => {
    const result = await HTMLtoDOCX('<pre><code>a &lt; b\n  c</code></pre>', {});
    const { xml } = await parseDOCX(result);

    expect(xml).toMatch(
      /<w:t xml:space="preserve">a &lt; b<\/w:t>\s*<w:br w:type="textWrapping"\/>\s*<w:t xml:space="preserve">  c<\/w:t>/
    );
  });

  test('handles a plain <pre> without <code>', async () => {
    const result = await HTMLtoDOCX('<pre>line 1\nline 2</pre>', {});
    const { xml } = await parseDOCX(result);

    expect(xml).toMatch(
      /line 1<\/w:t>\s*<w:br w:type="textWrapping"\/>\s*<w:t xml:space="preserve">line 2/
    );
  });

  test('leaves newlines outside <pre> alone', async () => {
    const result = await HTMLtoDOCX('<p>one\ntwo</p>', {});
    const { xml } = await parseDOCX(result);

    expect(xml).not.toMatch(/<w:br/);
  });
});
