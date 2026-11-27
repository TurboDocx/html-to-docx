/**
 * DOCX Part Helpers
 *
 * parseDOCX only reaches word/document.xml. Header and footer content goes
 * through the same renderer, so features that work in the body have to be
 * checked in header1.xml / footer1.xml too — and those roots declare fewer
 * namespaces than document.xml, which is exactly where a fragment relying on
 * an undeclared prefix would show up.
 */

import JSZip from 'jszip';
import { create } from 'xmlbuilder2';

/**
 * Convert HTML into a DOCX and return the three rendered parts.
 *
 * @param {Function} convert - The HTMLtoDOCX entry point
 * @param {Object} parts - { body, header, footer } HTML strings
 * @param {Object} options - Extra document options
 * @returns {Promise<Object>} { zip, documentXml, headerXml, footerXml }
 */
export async function renderParts(convert, { body = '<p></p>', header, footer }, options = {}) {
  const buffer = await convert(
    body,
    header,
    { header: Boolean(header), footer: Boolean(footer), ...options },
    footer
  );
  const zip = await new JSZip().loadAsync(buffer);

  return {
    zip,
    documentXml: await zip.file('word/document.xml').async('string'),
    headerXml: header ? await zip.file('word/header1.xml').async('string') : null,
    footerXml: footer ? await zip.file('word/footer1.xml').async('string') : null,
  };
}

/**
 * Assert an XML string parses. xmlbuilder2 is namespace-aware, so this also
 * catches a fragment that landed somewhere its prefix is not bound.
 *
 * @param {string} xmlString - The part to parse
 * @param {string} label - Part name, used in the failure message
 */
export function assertWellFormedXML(xmlString, label) {
  expect(typeof xmlString).toBe('string');
  expect(() => create(xmlString)).not.toThrow();
  // An unresolvable prefix is serialized with an empty default namespace
  // rather than rejected, so look for that explicitly.
  expect(`${label} has an unbound prefix: ${xmlString}`).not.toContain('xmlns=""');
}

/**
 * Index of the first match of `pattern`, or -1. Used to assert OOXML child
 * element ordering without depending on whitespace.
 *
 * @param {string} xmlString - XML to search
 * @param {RegExp|string} pattern - What to find
 * @returns {number} Index of the match
 */
export function indexOfElement(xmlString, pattern) {
  return xmlString.search(pattern);
}
