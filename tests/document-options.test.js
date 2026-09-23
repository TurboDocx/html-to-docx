import HTMLtoDOCX from '../index.js';
import { parseDOCX } from './helpers/docx-assertions.js';

describe('Document options', () => {
  test('treats null document options as defaults', async () => {
    const docx = await HTMLtoDOCX('<p>Hello from defaults</p>', null, null);
    const parsed = await parseDOCX(docx);

    expect(parsed.paragraphs.map((paragraph) => paragraph.text)).toContain('Hello from defaults');
  });
});
