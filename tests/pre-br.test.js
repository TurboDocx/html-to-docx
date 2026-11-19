/**
 * <br> inside <pre>
 *
 * Related issue: https://github.com/TurboDocx/html-to-docx/issues/253
 */

import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

describe('<br> inside <pre>', () => {
  test('wraps the line break in a run', async () => {
    const result = await HTMLtoDOCX('<pre><code>a<br>b</code></pre>', {});
    const { xml } = await parseDOCX(result);

    expect(xml).toMatch(/<w:br w:type="textWrapping"\/>/);
    expect(xml).not.toMatch(/<\/w:r>\s*<w:br /);
  });
});
