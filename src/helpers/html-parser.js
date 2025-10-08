/* eslint-disable no-restricted-syntax, no-continue, import/extensions */
/**
 * HTML to Virtual DOM Parser - Drop-in replacement for html-to-vdom package
 *
 * Converts HTML strings to virtual DOM trees using htmlparser2 for parsing.
 * Maintains full API compatibility with the unmaintained html-to-vdom package.
 *
 * This eliminates the security vulnerability (CVE-2025-57352) while providing
 * better HTML5 support and active maintenance via htmlparser2.
 */

import { parseDocument } from 'htmlparser2';
import { VNode, VText } from '../vdom/index.js';

/**
 * Parse CSS style string into object
 * @param {string} styleStr - CSS style string (e.g., "color: red; font-size: 12px")
 * @returns {object} Style object
 */
function parseStyle(styleStr) {
  if (!styleStr || typeof styleStr !== 'string') {
    return {};
  }

  const style = {};
  const declarations = styleStr.split(';').filter((s) => s.trim());

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const property = declaration.substring(0, colonIndex).trim();
    const value = declaration.substring(colonIndex + 1).trim();

    if (property && value) {
      style[property] = value;
    }
  }

  return style;
}

/**
 * Convert DOM element attributes to VNode properties
 * @param {object} element - DOM element from htmlparser2
 * @returns {object} VNode properties object
 */
function getProperties(element) {
  const properties = {
    attributes: {},
    style: {},
  };

  const attribs = element.attribs || {};

  // Process all attributes
  for (const [key, value] of Object.entries(attribs)) {
    if (key === 'style') {
      properties.style = parseStyle(value);
    } else if (key === 'class') {
      properties.attributes.class = value;
      properties.className = value;
    } else {
      properties.attributes[key] = value;
      properties[key] = value;
    }
  }

  return properties;
}

/**
 * Convert htmlparser2 node tree to VNode tree
 * @param {object} node - htmlparser2 DOM node
 * @returns {VNode|VText|null} Virtual DOM node
 */
function convertNode(node) {
  // Text node
  if (node.type === 'text') {
    const text = node.data || '';
    // Skip empty text nodes (only whitespace)
    if (text.trim() === '' && text.length > 0) {
      // Preserve single space
      return new VText(' ');
    }
    return text.trim() === '' ? null : new VText(text);
  }

  // Comment node - skip
  if (node.type === 'comment') {
    return null;
  }

  // Element node (tag)
  if (node.type === 'tag') {
    const tagName = node.name;
    const properties = getProperties(node);
    const children = [];

    // Process child nodes
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const vChild = convertNode(child);
        if (vChild !== null) {
          children.push(vChild);
        }
      }
    }

    return new VNode(tagName, properties, children);
  }

  // Root node - process children
  if (node.type === 'root') {
    const children = [];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const vChild = convertNode(child);
        if (vChild !== null) {
          children.push(vChild);
        }
      }
    }
    return children.length === 1 ? children[0] : children;
  }

  return null;
}

/**
 * Convert HTML string to virtual DOM tree
 * @param {string} html - HTML string
 * @returns {VNode|VText|Array} Virtual DOM tree
 */
export function convertHTML(html) {
  if (!html || typeof html !== 'string') {
    return null;
  }

  // Parse HTML with htmlparser2
  // decodeEntities: false preserves HTML entities as-is
  // lowerCaseTags/lowerCaseAttributeNames: true for consistency
  const document = parseDocument(html, {
    decodeEntities: false,
    lowerCaseTags: true,
    lowerCaseAttributeNames: true,
  });

  // Convert from htmlparser2 DOM to VNode tree
  return convertNode(document);
}

/**
 * Factory function for creating HTML to VDOM converter
 * Maintains API compatibility with html-to-vdom package
 * @returns {function} Converter function
 */
export default function createConverter() {
  return convertHTML;
}
