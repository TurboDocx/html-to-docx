import JSZip from 'jszip';
import { create } from 'xmlbuilder2';

/**
 * A DOCX package in canonical form, for comparing two converters' output where only meaning
 * matters. Each XML part is written one node per line with:
 *   - namespace prefixes resolved (a `ns1:` attribute without a namespace, as 1.23.3 wrote in
 *     headers and footers, counts as `w:`);
 *   - attributes sorted, namespace declarations dropped;
 *   - the body's `w:sectPr` last (the schema's place for it);
 *   - the children of `w:rPr`, `w:pPr` and `w:tcPr` sorted (the schema fixes their order, and
 *     the converter now writes it);
 *   - each `w:tblGrid` as its column count and total width (see serializeGrid);
 *   - indentation-only text dropped, but text inside `w:t`, `w:instrText` and `w:delText` kept
 *     exactly, since a lost space there is a real change.
 * `docProps/core.xml` (creation timestamps) is left out; other parts are compared byte for byte.
 */

const PREFIXES = {
  'http://schemas.openxmlformats.org/wordprocessingml/2006/main': 'w',
  'http://schemas.openxmlformats.org/drawingml/2006/main': 'a',
  'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing': 'wp',
  'http://schemas.openxmlformats.org/drawingml/2006/picture': 'pic',
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships': 'r',
  'http://schemas.openxmlformats.org/package/2006/relationships': 'rel',
  'http://schemas.openxmlformats.org/package/2006/content-types': 'ct',
  'http://schemas.microsoft.com/office/word/2010/wordprocessingShape': 'wps',
  'http://schemas.openxmlformats.org/markup-compatibility/2006': 'mc',
  'urn:schemas-microsoft-com:vml': 'v',
  'urn:schemas-microsoft-com:office:office': 'o',
  'http://www.w3.org/XML/1998/namespace': 'xml',
};
const XMLNS = 'http://www.w3.org/2000/xmlns/';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const SORTED_CHILDREN = new Set(['rPr', 'pPr', 'tcPr']);
const LITERAL_TEXT = new Set(['t', 'instrText', 'delText']);
const SKIPPED_PARTS = new Set(['docProps/core.xml']);

const prefixOf = (namespace) => (namespace ? PREFIXES[namespace] || namespace : '');

const qualified = (namespace, localName) => {
  const prefix = prefixOf(namespace);
  return prefix ? `${prefix}:${localName}` : localName;
};

const attributeName = (attribute) =>
  !attribute.namespaceURI && /^ns\d+:/.test(attribute.name)
    ? `w:${attribute.name.split(':')[1]}`
    : qualified(attribute.namespaceURI, attribute.localName);

const isNamespaceDeclaration = (attribute) =>
  attribute.namespaceURI === XMLNS ||
  attribute.name === 'xmlns' ||
  attribute.name.startsWith('xmlns:');

const serializeText = (node, indent) => {
  if (node.parentNode && LITERAL_TEXT.has(node.parentNode.localName)) {
    return `${indent}${JSON.stringify(node.data)}\n`;
  }
  const text = node.data.trim();
  return text ? `${indent}${JSON.stringify(text)}\n` : '';
};

// A grid column's width is a whole number of twips (ST_TwipsMeasure is an unsigned integer or a
// measure with a unit). 1.23.3 wrote fractions, which is invalid; the converter now writes whole
// numbers with the remainder on the last column. A grid compares by column count and total width.
const serializeGrid = (node, indent) => {
  const widths = [...node.childNodes]
    .filter((child) => child.localName === 'gridCol')
    .map((child) => Number(child.getAttributeNS(W, 'w')) || 0);
  const total = Math.round(widths.reduce((sum, width) => sum + width, 0));
  return `${indent}<w:tblGrid columns="${widths.length}" total="${total}">\n`;
};

const serialize = (node, indent) => {
  if (node.nodeType === 3 || node.nodeType === 4) return serializeText(node, indent);
  if (node.nodeType !== 1) return '';
  if (node.localName === 'tblGrid' && node.namespaceURI === W) return serializeGrid(node, indent);

  const attributes = [...node.attributes]
    .filter((attribute) => !isNamespaceDeclaration(attribute))
    .map((attribute) => `${attributeName(attribute)}=${JSON.stringify(attribute.value)}`)
    .toSorted();

  const children = [...node.childNodes];
  const ordered =
    node.localName === 'body'
      ? [
          ...children.filter((child) => child.localName !== 'sectPr'),
          ...children.filter((child) => child.localName === 'sectPr'),
        ]
      : children;
  const inner = ordered.map((child) => serialize(child, `${indent}  `));
  const body = SORTED_CHILDREN.has(node.localName) ? inner.toSorted() : inner;

  const attributeText = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
  return `${indent}<${qualified(node.namespaceURI, node.localName)}${attributeText}>\n${body.join(
    ''
  )}`;
};

/**
 * One XML part in canonical form.
 *
 * @param {string} xml The part's XML.
 * @returns {string} One node per line, in canonical order.
 */
export const canonicalXml = (xml) => serialize(create(xml).root().node, '');

const canonicalPart = async (name, file) => {
  if (/\.(xml|rels)$/.test(name)) return canonicalXml(await file.async('string'));
  return `base64:${await file.async('base64')}`;
};

/**
 * Every part of a DOCX package: XML parts in canonical form, other parts as base64.
 *
 * @param {Buffer|Blob} buffer The DOCX package.
 * @returns {Promise<Record<string, string>>} Part name to canonical content.
 */
export const canonicalDocx = async (buffer) => {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files)
    .filter((name) => !zip.files[name].dir && !SKIPPED_PARTS.has(name))
    .toSorted();
  const contents = await Promise.all(names.map((name) => canonicalPart(name, zip.files[name])));
  return Object.fromEntries(names.map((name, index) => [name, contents[index]]));
};

const firstDifference = (expected, actual) => {
  const a = expected.split('\n');
  const b = actual.split('\n');
  const mismatch = a.findIndex((text, index) => text !== b[index]);
  const line = mismatch === -1 ? Math.min(a.length, b.length) : mismatch;
  const window = (lines) => lines.slice(Math.max(0, line - 2), line + 4).join('\n');
  return `first difference at line ${line + 1}\n--- 1.23.3\n${window(a)}\n+++ this branch\n${window(
    b
  )}`;
};

const describePart = (name, expected, actual) => {
  if (!(name in expected)) return `${name}: only in this branch`;
  if (!(name in actual)) return `${name}: missing from this branch`;
  if (expected[name] !== actual[name])
    return `${name}: ${firstDifference(expected[name], actual[name])}`;
  return null;
};

/**
 * The parts that differ between two canonical packages, each with its first differing lines.
 *
 * @param {Record<string, string>} expected The 1.23.3 package, from canonicalDocx.
 * @param {Record<string, string>} actual This branch's package, from canonicalDocx.
 * @returns {string[]} One entry per differing part; empty when the packages match.
 */
export const differences = (expected, actual) =>
  [...new Set([...Object.keys(expected), ...Object.keys(actual)])]
    .toSorted()
    .map((name) => describePart(name, expected, actual))
    .filter(Boolean);
