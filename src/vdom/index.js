/* eslint-disable max-classes-per-file */
/**
 * Custom Virtual DOM classes - Drop-in replacement for virtual-dom package
 *
 * These classes provide simple data structures for representing HTML as a tree,
 * matching the API of the unmaintained virtual-dom package.
 *
 * This eliminates the security vulnerability (CVE-2025-57352) in virtual-dom's
 * transitive dependency min-document, while maintaining full API compatibility.
 */

/**
 * VNode - Represents an HTML element in the virtual DOM tree
 */
export class VNode {
  constructor(tagName, properties = {}, children = [], key = null, namespace = null) {
    this.tagName = tagName ? tagName.toLowerCase() : '';
    this.properties = properties || {};
    this.children = children || [];
    this.key = key;
    this.namespace = namespace;
    this.count = children.length;
    this.descendants = 0;

    // Calculate descendants count (for compatibility with virtual-dom)
    if (Array.isArray(children)) {
      for (let i = 0; i < children.length; i += 1) {
        const child = children[i];
        if (child) {
          this.descendants += 1;
          if (child.descendants) {
            this.descendants += child.descendants;
          }
        }
      }
    }
  }
}

/**
 * VText - Represents a text node in the virtual DOM tree
 */
export class VText {
  constructor(text) {
    this.text = String(text);
  }
}

/**
 * Check if a value is a VNode
 */
export function isVNode(vnode) {
  return vnode instanceof VNode;
}

/**
 * Check if a value is a VText
 */
export function isVText(vtext) {
  return vtext instanceof VText;
}

// Default exports for compatibility with virtual-dom imports
export default VNode;
