// The release this branch must not change for existing callers (devDependency alias).
import baseline from 'h2d-baseline';

import HTMLtoDOCX from '../index';
import corpus from './fixtures/zero-regression/corpus.json';
import probes from './fixtures/zero-regression/probes';
import { canonicalDocx, differences } from './helpers/canonical-docx';

/**
 * Zero regressions: a caller who upgrades from 1.23.3 and passes none of the new options gets the
 * same document. Every corpus entry (the examples and the HTML in 1.23.3's own tests, see
 * tests/fixtures/zero-regression/build-corpus.mjs) and every probe (one per change the document editor
 * work made, tests/fixtures/zero-regression/probes.js) is rendered with 1.23.3 and with this
 * branch, and every part of the two packages must match in canonical form
 * (tests/helpers/canonical-docx.js).
 */

// The options 1.23.3 understood. An example's option outside this list is dropped, so the suite
// never turns on something new by accident.
const OPTIONS_1_23_3 = new Set([
  'orientation',
  'pageSize',
  'margins',
  'title',
  'subject',
  'creator',
  'keywords',
  'description',
  'lastModifiedBy',
  'revision',
  'createdAt',
  'modifiedAt',
  'headerType',
  'header',
  'footerType',
  'footer',
  'font',
  'fontSize',
  'complexScriptFontSize',
  'table',
  'pageNumber',
  'skipFirstHeaderFooter',
  'lineNumber',
  'lineNumberOptions',
  'numbering',
  'heading',
  'decodeUnicode',
  'lang',
  'direction',
  'preprocessing',
  'skipHTMLMinify',
  'imageProcessing',
]);

const optionsFor = (options = {}) => ({
  ...Object.fromEntries(Object.entries(options).filter(([key]) => OPTIONS_1_23_3.has(key))),
  deterministicIds: true,
});

const render = async (convert, entry) => {
  try {
    const buffer = await convert(
      entry.html,
      entry.headerHTML ?? null,
      optionsFor(entry.options),
      entry.footerHTML ?? null
    );
    return { error: null, parts: await canonicalDocx(buffer) };
  } catch (error) {
    return { error: String(error?.message ?? error), parts: {} };
  }
};

const DOCUMENT = 'word/document.xml';
const NULL_NUMBERING = '<w:numId w:val="null">';

// A list item whose text follows a nested paragraph (`<li><p>a</p>tail</li>`) made 1.23.3 write
// numId="null", which is invalid (numId is an integer), so the converter now writes a valid
// continuation paragraph. For a document 1.23.3 wrote that way, the document part may differ but
// must hold no null numId; every other part must still match.
const withValidityFixes = (expected, actual) => {
  const fixesNullNumbering = expected.parts[DOCUMENT]?.includes(NULL_NUMBERING) ?? false;
  if (!fixesNullNumbering) return differences(expected.parts, actual.parts);
  const { [DOCUMENT]: expectedDocument, ...expectedRest } = expected.parts;
  const { [DOCUMENT]: actualDocument, ...actualRest } = actual.parts;
  const stillNull = actualDocument?.includes(NULL_NUMBERING)
    ? [`${DOCUMENT}: still has numId="null"`]
    : [];
  return [...differences(expectedRest, actualRest), ...stillNull];
};

// Both renders as one comparable value: whether they threw alike, and the parts that differ.
const compare = async (entry) => {
  const expected = await render(baseline, entry);
  const actual = await render(HTMLtoDOCX, entry);
  return {
    error:
      actual.error === expected.error ? 'same' : { expected: expected.error, actual: actual.error },
    differences: withValidityFixes(expected, actual),
  };
};

const cases = [...corpus.entries, ...probes].map((entry) => [entry.name, entry]);

describe('zero regressions against 1.23.3 with no new options', () => {
  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it.each(cases)(
    '%s',
    async (_name, entry) => {
      await expect(compare(entry)).resolves.toStrictEqual({ error: 'same', differences: [] });
    },
    60000
  );
});
