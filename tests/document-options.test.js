import HTMLtoDOCX from '../index.js';
import { defaultDocumentOptions } from '../src/constants';
import createDocumentOptionsAndMergeWithDefaults from '../src/utils/options-utils';
import { parseDOCX } from './helpers/docx-assertions.js';

describe('Document options', () => {
  test.each([
    ['omitted', []],
    ['undefined', [null, undefined]],
    ['null', [null, null]],
    ['empty', [null, {}]],
  ])('treats %s document options as defaults', async (_label, args) => {
    const docx = await HTMLtoDOCX('<p>Hello from defaults</p>', ...args);
    const parsed = await parseDOCX(docx);

    expect(parsed.paragraphs.map((paragraph) => paragraph.text)).toContain('Hello from defaults');
  });

  test.each([undefined, null, {}])('merges %p options with defaults', (options) => {
    expect(createDocumentOptionsAndMergeWithDefaults(options)).toEqual(defaultDocumentOptions);
  });

  test('normalizes units and preserves false options without mutating the input', () => {
    const options = Object.freeze({
      pageSize: Object.freeze({ width: '8.5in', height: '11in' }),
      margins: Object.freeze({ top: '1in' }),
      fontSize: '12pt',
      complexScriptFontSize: '10pt',
      table: Object.freeze({ row: Object.freeze({ cantSplit: false }) }),
    });

    expect(createDocumentOptionsAndMergeWithDefaults(options)).toMatchObject({
      pageSize: { width: 12240, height: 15840 },
      margins: { top: 1440 },
      fontSize: 24,
      complexScriptFontSize: 20,
      table: { row: { cantSplit: false } },
    });
    expect(options.pageSize).toEqual({ width: '8.5in', height: '11in' });
    expect(options.margins).toEqual({ top: '1in' });
    expect(options.fontSize).toBe('12pt');
    expect(options.complexScriptFontSize).toBe('10pt');
  });
});
