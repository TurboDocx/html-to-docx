/* eslint-disable no-continue, no-restricted-syntax */
/**
 * CSS Stylesheet Resolver
 *
 * Folds a CSS stylesheet into each matched element's inline `style` attribute
 * BEFORE the HTML is converted to the virtual DOM. The rest of the pipeline
 * (xml-builder) reads styling exclusively from each element's parsed inline
 * `style`, so resolving the stylesheet here lets every CSS property the library
 * already understands work from a stylesheet too, with no downstream changes.
 *
 * CSS comes from two sources:
 *   1. `documentOptions.css` (an attached stylesheet string)
 *   2. embedded `<style>` tags in the HTML (extracted and removed so their raw
 *      text is never rendered as document content)
 *
 * The cascade is resolved by real selector specificity (id > class/attr/pseudo
 * > type) with source order breaking ties. The element's own inline declaration
 * always wins because it is concatenated LAST onto the `style` string and
 * `parseStyles` (in html-parser.js) is last-write-wins.
 *
 * `!important`, `@media`/at-rules, and `<link>` fetching are intentionally out
 * of scope for this version.
 */

import { selectAll } from 'css-select';
import * as csstree from 'css-tree';
import { removeElement, textContent } from 'domutils';

/**
 * Compute the specificity of a single css-tree Selector node as an
 * [a, b, c] tuple where:
 *   a = number of id selectors
 *   b = number of class, attribute, and pseudo-class selectors
 *   c = number of type and pseudo-element selectors (universal `*` excluded)
 *
 * @param {Object} selectorNode - a css-tree `Selector` AST node
 * @returns {number[]} `[a, b, c]`
 */
function computeSpecificity(selectorNode) {
  const specificity = [0, 0, 0];

  csstree.walk(selectorNode, (node) => {
    switch (node.type) {
      case 'IdSelector':
        specificity[0] += 1;
        break;
      case 'ClassSelector':
      case 'AttributeSelector':
      case 'PseudoClassSelector':
        specificity[1] += 1;
        break;
      case 'TypeSelector':
        if (node.name !== '*') specificity[2] += 1;
        break;
      case 'PseudoElementSelector':
        specificity[2] += 1;
        break;
      default:
        break;
    }
  });

  return specificity;
}

/** Compare two `[a, b, c]` specificity tuples. Returns <0, 0, or >0. */
function compareSpecificity(left, right) {
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

/**
 * Serialize a css-tree Block (declaration list) into a normalized
 * `prop: value; prop: value;` string. `!important` is ignored (the declaration
 * is kept, its importance is not).
 *
 * @param {Object} blockNode - a css-tree `Block` AST node
 * @returns {string}
 */
function serializeDeclarations(blockNode) {
  const parts = [];

  if (blockNode && blockNode.children) {
    blockNode.children.forEach((declaration) => {
      if (declaration.type !== 'Declaration') return;
      const value = csstree.generate(declaration.value).trim();
      if (declaration.property && value) {
        parts.push(`${declaration.property}: ${value}`);
      }
    });
  }

  return parts.join('; ');
}

/**
 * Extract the CSS text from every `<style>` element in the DOM and remove those
 * elements so their contents do not leak into the rendered document.
 *
 * @param {Object} params
 * @param {(Object|Object[])} params.dom - htmlparser2/domhandler DOM (node or node array)
 * @returns {string} concatenated CSS text from all `<style>` tags (in document order)
 */
export function extractAndStripStyleTags({ dom }) {
  let styleNodes;
  try {
    styleNodes = selectAll('style', dom);
  } catch (error) {
    return '';
  }

  const cssChunks = styleNodes.map((node) => textContent(node));
  styleNodes.forEach((node) => removeElement(node));

  return cssChunks.join('\n');
}

/**
 * Parse a stylesheet into a flat, ordered list of rules.
 * Malformed CSS is tolerated: parse errors are swallowed and only the rules
 * that parsed successfully are returned.
 *
 * @param {string} cssText
 * @returns {{selectors: {text: string, specificity: number[]}[], declarations: string, order: number}[]}
 */
function collectRules(cssText) {
  let ast;
  try {
    ast = csstree.parse(cssText, { onParseError: () => {} });
  } catch (error) {
    return [];
  }

  const rules = [];
  let order = 0;

  csstree.walk(ast, {
    visit: 'Rule',
    enter(rule) {
      // Only plain style rules (a SelectorList prelude). Skip at-rules etc.
      if (!rule.prelude || rule.prelude.type !== 'SelectorList') return;

      const declarations = serializeDeclarations(rule.block);
      if (!declarations) return;

      const selectors = [];
      rule.prelude.children.forEach((selectorNode) => {
        let text;
        try {
          text = csstree.generate(selectorNode);
        } catch (error) {
          return;
        }
        selectors.push({ text, specificity: computeSpecificity(selectorNode) });
      });

      if (selectors.length) {
        rules.push({ selectors, declarations, order });
        order += 1;
      }
    },
  });

  return rules;
}

/**
 * Apply a CSS stylesheet to an htmlparser2 DOM by folding matched declarations
 * into each element's inline `style` attribute. Mutates the DOM in place.
 *
 * CSS is taken from `css` (attached stylesheet) and from embedded `<style>`
 * tags in the DOM. The attached stylesheet is treated as appearing BEFORE the
 * embedded `<style>` tags, so embedded rules win ties by source order.
 *
 * @param {Object} params
 * @param {(Object|Object[])} params.dom - htmlparser2/domhandler DOM (node or node array)
 * @param {string} [params.css] - attached stylesheet text
 * @param {Function} [params.logger] - optional `(message) => void` for skipped selectors
 * @returns {void}
 */
export function applyStylesheet({ dom, css = '', logger } = {}) {
  if (!dom) return;

  const embeddedCss = extractAndStripStyleTags({ dom });
  const combinedCss = [css || '', embeddedCss].filter(Boolean).join('\n');
  if (!combinedCss.trim()) return;

  const rules = collectRules(combinedCss);
  if (!rules.length) return;

  // Map from element node -> list of matched declaration sets.
  const matchesByElement = new Map();

  rules.forEach((rule) => {
    rule.selectors.forEach((selector) => {
      let elements;
      try {
        elements = selectAll(selector.text, dom);
      } catch (error) {
        if (typeof logger === 'function') {
          logger(`[css] skipping unsupported selector "${selector.text}": ${error.message}`);
        }
        return;
      }

      elements.forEach((element) => {
        if (!matchesByElement.has(element)) matchesByElement.set(element, []);
        matchesByElement.get(element).push({
          specificity: selector.specificity,
          order: rule.order,
          declarations: rule.declarations,
        });
      });
    });
  });

  matchesByElement.forEach((entries, element) => {
    entries.sort((left, right) => {
      const bySpecificity = compareSpecificity(left.specificity, right.specificity);
      if (bySpecificity !== 0) return bySpecificity;
      return left.order - right.order;
    });

    const stylesheetStyle = entries.map((entry) => entry.declarations).join('; ');
    const inlineStyle = (element.attribs && element.attribs.style) || '';

    // Inline declarations come LAST so they win (parseStyles is last-write-wins).
    const combined = [stylesheetStyle, inlineStyle.trim()].filter(Boolean).join('; ');

    if (!element.attribs) element.attribs = {};
    element.attribs.style = combined;
  });
}
