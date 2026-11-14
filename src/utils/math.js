/* eslint-disable no-console */
import { fragment } from 'xmlbuilder2';
import { decode } from 'html-entities';

import namespaces from '../namespaces';
import { isVNode, isVText } from '../vdom/index';

/**
 * MathML support.
 *
 * Word stores equations as OMML (Office Math Markup Language), not MathML. This module
 * turns a <math> VNode back into a MathML string, hands it to a user-supplied converter
 * (documentOptions.math.converter) and imports the resulting OMML into the document.
 *
 * No MathML -> OMML converter is bundled on purpose: the available JavaScript
 * implementations carry licenses that are not compatible with bundling into this
 * MIT package. Users plug in the converter of their choice, e.g. `mathml2omml`.
 *
 * Without a converter, or when conversion fails, the equation is emitted as a plain
 * text run so its content is never silently dropped.
 */

const MATHML_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';

// Properties the HTML parser lifts out of `attributes` that are meaningful in MathML.
const MATHML_PROPERTY_ATTRIBUTES = ['width', 'height', 'dir'];

// Presentation/HTML attributes that carry nothing for OMML conversion.
const HTML_ONLY_ATTRIBUTE_REGEX = /^(class|id|style|data-.*|aria-.*)$/i;

const escapeXmlText = (text) =>
  String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const escapeXmlAttribute = (value) => escapeXmlText(value).replaceAll('"', '&quot;');

/**
 * Serializes the text of a MathML text node. Whitespace between MathML elements is
 * insignificant and leading/trailing whitespace inside token elements is trimmed
 * (MathML Core §2.1.7); only <mtext> and <ms> keep their inner spacing, collapsed.
 * @param {Object} vText - text node
 * @param {string} parentTagName - tag name of the enclosing MathML element
 * @returns {string} escaped text
 */
const serializeMathText = (vText, parentTagName) => {
  const collapsed = vText.text.replaceAll(/\s+/g, ' ');
  const keepsSpacing = parentTagName === 'mtext' || parentTagName === 'ms';
  return escapeXmlText(keepsSpacing ? collapsed : collapsed.trim());
};

/**
 * Serializes a MathML VNode tree back to a MathML XML string.
 * Inline styles and HTML-only attributes (class, id…) are dropped: OMML has no use for them.
 * @param {Object} vNode - MathML element VNode
 * @param {boolean} isRoot - whether vNode is the <math> root
 * @returns {string} MathML markup
 */
export const serializeVNodeToMathML = (vNode, isRoot = true) => {
  if (!isVNode(vNode) || !vNode.tagName) {
    return '';
  }

  const { tagName, properties = {}, children = [] } = vNode;
  const attributes = { ...properties.attributes };

  MATHML_PROPERTY_ATTRIBUTES.forEach((name) => {
    if (properties[name] !== undefined && properties[name] !== null && properties[name] !== '') {
      attributes[name] = properties[name];
    }
  });

  if (isRoot && tagName === 'math') {
    attributes.xmlns = MATHML_NAMESPACE;
  }

  const attributeString = Object.entries(attributes)
    .filter(([key]) => !HTML_ONLY_ATTRIBUTE_REGEX.test(key))
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => ` ${key}="${escapeXmlAttribute(value)}"`)
    .join('');

  const content = children
    .map((child) =>
      isVText(child) ? serializeMathText(child, tagName) : serializeVNodeToMathML(child, false)
    )
    .join('');

  return content
    ? `<${tagName}${attributeString}>${content}</${tagName}>`
    : `<${tagName}${attributeString}/>`;
};

/**
 * Concatenated text content of a VNode tree (used for the plain-text fallback).
 * @param {Object} vNode - VNode or VText
 * @returns {string} text content
 */
export const getMathTextContent = (vNode) => {
  if (isVText(vNode)) {
    return vNode.text;
  }
  if (!isVNode(vNode) || !vNode.children) {
    return '';
  }
  return vNode.children.map((child) => getMathTextContent(child)).join('');
};

/**
 * Whether a <math> VNode is a display (block) equation.
 * @param {Object} vNode - the <math> VNode
 * @returns {boolean} true for display="block"
 */
export const isDisplayMath = (vNode) => {
  const attributes = vNode?.properties?.attributes || {};
  return String(attributes.display || '').toLowerCase() === 'block';
};

/**
 * Some string-based converters emit raw `<`, `>` or `&` inside <m:t> text nodes
 * (e.g. for the "less than" operator), which is not well-formed XML. Re-escape the
 * text content of every <m:t> so the fragment can be parsed.
 * xmlbuilder2 also drops whitespace-only text nodes when parsing, so a spacing-only
 * run (e.g. from <mspace/>) is kept by using no-break spaces instead.
 * @param {string} omml - OMML markup
 * @returns {string} OMML markup with well-formed <m:t> content
 */
export const escapeOmmlText = (omml) =>
  omml.replaceAll(/<m:t(\s[^>]*)?>([\s\S]*?)<\/m:t>/g, (match, attrs, text) => {
    const decoded = decode(text, { level: 'xml' });
    const content = /^\s+$/.test(decoded) ? decoded.replaceAll(/\s/g, ' ') : decoded;
    return `<m:t${attrs || ''}>${escapeXmlText(content)}</m:t>`;
  });

/**
 * Makes sure the root element of an OMML string declares the `m` (and `w`) namespaces
 * so it can be parsed on its own.
 * @param {string} omml - OMML markup
 * @returns {string} OMML markup with namespace declarations on its root
 */
const ensureNamespaces = (omml) => {
  const rootTag = omml.slice(0, omml.indexOf('>'));
  let declarations = '';
  if (!/\sxmlns:m=/.test(rootTag)) {
    declarations += ` xmlns:m="${namespaces.m}"`;
  }
  if (!/\sxmlns:w=/.test(rootTag)) {
    declarations += ` xmlns:w="${namespaces.w}"`;
  }
  return omml.replace(/^(<m:[A-Za-z]+)/, `$1${declarations}`);
};

/**
 * xmlbuilder2's string parser keeps character references (`&lt;`, `&#x3C;`…) as literal
 * text, which would be escaped a second time on output. Decode them in place.
 * @param {Object} node - DOM node of a parsed xmlbuilder2 fragment
 */
const decodeParsedEntities = (node) => {
  if (node.nodeType === 3 || node.nodeType === 4) {
    // eslint-disable-next-line no-param-reassign
    node.data = decode(node.data, { level: 'xml' });
    return;
  }
  [...(node.attributes || [])].forEach((attribute) => {
    // eslint-disable-next-line no-param-reassign
    attribute.value = decode(attribute.value, { level: 'xml' });
  });
  [...(node.childNodes || [])].forEach((child) => decodeParsedEntities(child));
};

/**
 * Normalizes converter output into a parsed xmlbuilder2 fragment holding a single
 * <m:oMath> (inline) or <m:oMathPara> (display) element.
 * @param {string} omml - converter output
 * @param {boolean} display - whether the equation is a display equation
 * @returns {Object} xmlbuilder2 fragment
 */
export const buildOmmlFragment = (omml, display) => {
  let normalized = String(omml)
    .replace(/^\s*<\?xml[^>]*\?>/, '')
    .trim();

  if (!/^<m:(oMath|oMathPara)[\s>/]/.test(normalized)) {
    throw new Error('Converter output must start with <m:oMath> or <m:oMathPara>');
  }

  normalized = escapeOmmlText(normalized);

  if (display && !/^<m:oMathPara[\s>/]/.test(normalized)) {
    // Namespace declarations move to the new root so the inner element stays valid.
    const inner = normalized.replace(/^<m:oMath\b[^>]*>/, '<m:oMath>');
    normalized = `<m:oMathPara>${inner}</m:oMathPara>`;
  }

  const ommlFragment = fragment(ensureNamespaces(normalized));
  decodeParsedEntities(ommlFragment.node);
  return ommlFragment;
};

/**
 * Builds a plain text run used when no converter is configured or conversion fails.
 * @param {string} text - text of the run
 * @param {Object} runPropertiesFragment - optional <w:rPr> fragment
 * @returns {Object} xmlbuilder2 fragment
 */
const buildFallbackRun = (text, runPropertiesFragment) => {
  const runFragment = fragment({ namespaceAlias: { w: namespaces.w } }).ele('@w', 'r');
  if (runPropertiesFragment) {
    runFragment.import(runPropertiesFragment);
  }
  runFragment.ele('@w', 't').att('@xml', 'space', 'preserve').txt(text).up();
  runFragment.up();
  return runFragment;
};

let warnedAboutMissingConverter = false;

/**
 * Converts a <math> VNode into a DOCX fragment.
 * @param {Object} vNode - the <math> VNode
 * @param {Object} docxDocumentInstance - document being built (reads `math.converter`)
 * @param {Object} runPropertiesFragment - <w:rPr> used for the plain-text fallback
 * @returns {Promise<Object>} xmlbuilder2 fragment (<m:oMath>, <m:oMathPara> or a fallback <w:r>)
 */
export const buildMath = async (vNode, docxDocumentInstance, runPropertiesFragment = null) => {
  const display = isDisplayMath(vNode);
  const converter = docxDocumentInstance?.math?.converter;
  const textContent = getMathTextContent(vNode).replaceAll(/\s+/g, ' ').trim();

  if (typeof converter !== 'function') {
    if (!warnedAboutMissingConverter) {
      warnedAboutMissingConverter = true;
      console.warn(
        '[html-to-docx] <math> found but no math.converter configured; ' +
          'equations are exported as plain text. See the "Math (MathML)" section of the README.'
      );
    }
    return buildFallbackRun(textContent, runPropertiesFragment);
  }

  try {
    // The converter may be synchronous or return a Promise.
    const omml = await converter(serializeVNodeToMathML(vNode), { display });
    return buildOmmlFragment(omml, display);
  } catch (error) {
    console.warn(`[html-to-docx] MathML conversion failed, using plain text: ${error.message}`);
    return buildFallbackRun(textContent, runPropertiesFragment);
  }
};
