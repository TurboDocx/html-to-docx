/**
 * SVG Sanitizer - Security module for cleaning potentially malicious SVG content
 *
 * This module provides whitelist-based sanitization to prevent:
 * - XSS attacks via <script> tags or event handlers
 * - XXE (XML External Entity) attacks
 * - JavaScript protocol injection
 * - Foreign object exploitation
 *
 * @module svg-sanitizer
 */

/**
 * Whitelist of allowed SVG elements
 * Based on SVG 1.1/2.0 specification safe elements for static graphics
 */
const ALLOWED_ELEMENTS = new Set([
  // Container elements
  'svg',
  'g',
  'defs',
  'symbol',
  'marker',
  'clipPath',
  'mask',
  'pattern',

  // Shape elements
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',

  // Text elements
  'text',
  'tspan',
  'textPath',

  // Gradient elements
  'linearGradient',
  'radialGradient',
  'stop',

  // Filter elements
  'filter',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',

  // Other elements
  'image',
  'use',
  'title',
  'desc',
  'metadata',
  'switch',
  'a',
]);

/**
 * Whitelist of allowed SVG attributes
 * Excludes all event handlers and dangerous attributes
 */
const ALLOWED_ATTRIBUTES = new Set([
  // Core attributes
  'xmlns',
  'xmlns:xlink',
  'id',
  'class',
  'style',
  'tabindex',

  // Dimension and position attributes
  'width',
  'height',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'dx',
  'dy',

  // ViewBox and aspect ratio
  'viewBox',
  'preserveAspectRatio',

  // Path and shape attributes
  'd',
  'points',
  'pathLength',

  // Transform
  'transform',

  // Presentation attributes - Fill
  'fill',
  'fill-opacity',
  'fill-rule',

  // Presentation attributes - Stroke
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-dasharray',
  'stroke-dashoffset',

  // Presentation attributes - Other
  'opacity',
  'visibility',
  'display',
  'overflow',
  'clip-path',
  'clip-rule',
  'mask',
  'filter',

  // Text attributes
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'font-stretch',
  'text-anchor',
  'text-decoration',
  'text-rendering',
  'letter-spacing',
  'word-spacing',
  'writing-mode',
  'direction',
  'dominant-baseline',
  'alignment-baseline',
  'baseline-shift',

  // Gradient attributes
  'gradientUnits',
  'gradientTransform',
  'spreadMethod',
  'offset',
  'stop-color',
  'stop-opacity',

  // Filter attributes
  'in',
  'in2',
  'result',
  'type',
  'values',
  'mode',
  'stdDeviation',
  'edgeMode',
  'kernelMatrix',
  'divisor',
  'bias',
  'targetX',
  'targetY',
  'surfaceScale',
  'specularConstant',
  'specularExponent',
  'diffuseConstant',
  'scale',
  'xChannelSelector',
  'yChannelSelector',
  'k1',
  'k2',
  'k3',
  'k4',
  'operator',
  'radius',
  'baseFrequency',
  'numOctaves',
  'seed',
  'stitchTiles',
  'order',
  'kernelUnitLength',
  'pointsAtX',
  'pointsAtY',
  'pointsAtZ',
  'limitingConeAngle',
  'z',
  'azimuth',
  'elevation',

  // Link attributes (href will be sanitized separately)
  'href',
  'xlink:href',
  'target',

  // Use element
  'xlink:href',

  // Image element
  'preserveAspectRatio',

  // Marker attributes
  'markerWidth',
  'markerHeight',
  'refX',
  'refY',
  'orient',
  'markerUnits',

  // Pattern attributes
  'patternUnits',
  'patternContentUnits',
  'patternTransform',

  // ClipPath attributes
  'clipPathUnits',

  // Mask attributes
  'maskUnits',
  'maskContentUnits',
]);

/**
 * Elements that are explicitly disallowed for security reasons
 */
const DISALLOWED_ELEMENTS = new Set([
  'script',
  'foreignObject',
  'iframe',
  'embed',
  'object',
  'applet',
  'frame',
  'frameset',
]);

/**
 * Regex to detect event handler attributes (onclick, onload, etc.)
 */
const DANGEROUS_ATTRIBUTES = /^on[a-z]/i;

/**
 * Regex to detect dangerous protocols in href/src attributes
 */
const DANGEROUS_PROTOCOLS = /^\s*(javascript|data|vbscript|file|about):/i;

/**
 * Check if a URL/href value contains a dangerous protocol
 * @param {string} value - The attribute value to check
 * @returns {boolean} True if dangerous, false if safe
 */
const hasDangerousProtocol = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();

  // Allow http, https, and fragment identifiers (#id)
  if (
    trimmedValue.startsWith('#') ||
    trimmedValue.startsWith('http://') ||
    trimmedValue.startsWith('https://')
  ) {
    return false;
  }

  // Check for dangerous protocols
  return DANGEROUS_PROTOCOLS.test(trimmedValue);
};

/**
 * Sanitizes an SVG VNode by filtering out dangerous elements and attributes
 *
 * @param {Object} vNode - The VNode to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.verboseLogging - Enable detailed logging
 * @param {boolean} options.enabled - Enable/disable sanitization (default: true)
 * @returns {Object|null} Sanitized VNode or null if blocked
 */
export const sanitizeSVGVNode = (vNode, options = {}) => {
  const { verboseLogging = false, enabled = true } = options;

  // If sanitization is disabled, return vNode as-is
  if (!enabled) {
    return vNode;
  }

  if (!vNode || !vNode.tagName) {
    return null;
  }

  // SVG elements can be camelCase (linearGradient, radialGradient, etc.)
  // so we need to check both original case and lowercase
  const { tagName } = vNode;
  const lowerTagName = tagName.toLowerCase();

  // Block explicitly disallowed elements
  if (DISALLOWED_ELEMENTS.has(lowerTagName)) {
    if (verboseLogging) {
      // eslint-disable-next-line no-console
      console.warn(`[SVG SANITIZER] Blocked dangerous element: <${vNode.tagName}>`);
    }
    return null;
  }

  // Only allow whitelisted elements (check both camelCase and lowercase)
  if (!ALLOWED_ELEMENTS.has(tagName) && !ALLOWED_ELEMENTS.has(lowerTagName)) {
    if (verboseLogging) {
      // eslint-disable-next-line no-console
      console.warn(`[SVG SANITIZER] Removed non-whitelisted element: <${vNode.tagName}>`);
    }
    return null;
  }

  // Create sanitized copy of vNode
  const sanitizedVNode = { ...vNode };

  // Sanitize attributes
  if (vNode.properties) {
    const attributes = vNode.properties.attributes || {};
    const sanitizedAttributes = {};
    let removedCount = 0;

    Object.entries(attributes).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();

      // Block event handlers
      if (DANGEROUS_ATTRIBUTES.test(lowerKey)) {
        if (verboseLogging) {
          // eslint-disable-next-line no-console
          console.warn(`[SVG SANITIZER] Removed event handler: ${key}="${value}"`);
        }
        removedCount += 1;
        return;
      }

      // Block dangerous protocols in href/xlink:href
      if ((lowerKey === 'href' || lowerKey === 'xlink:href') && hasDangerousProtocol(value)) {
        if (verboseLogging) {
          // eslint-disable-next-line no-console
          console.warn(`[SVG SANITIZER] Blocked dangerous protocol in ${key}: ${value}`);
        }
        removedCount += 1;
        return;
      }

      // Allow whitelisted attributes and data-* attributes (safe for data storage)
      if (
        ALLOWED_ATTRIBUTES.has(lowerKey) ||
        lowerKey.startsWith('data-') ||
        lowerKey.startsWith('aria-')
      ) {
        sanitizedAttributes[key] = value;
      } else {
        if (verboseLogging) {
          // eslint-disable-next-line no-console
          console.warn(`[SVG SANITIZER] Removed non-whitelisted attribute: ${key}="${value}"`);
        }
        removedCount += 1;
      }
    });

    sanitizedVNode.properties = {
      ...vNode.properties,
      attributes: sanitizedAttributes,
    };

    if (removedCount > 0 && verboseLogging) {
      // eslint-disable-next-line no-console
      console.log(`[SVG SANITIZER] Removed ${removedCount} unsafe attribute(s) from <${tagName}>`);
    }
  }

  // Recursively sanitize children
  if (vNode.children && vNode.children.length > 0) {
    const sanitizedChildren = vNode.children
      .map((child) => {
        // Text nodes are safe - they get escaped during XML serialization
        if (typeof child === 'string' || child.text) {
          return child;
        }
        // Recursively sanitize VNode children
        return sanitizeSVGVNode(child, options);
      })
      .filter(Boolean); // Remove null entries (blocked elements)

    sanitizedVNode.children = sanitizedChildren;

    if (sanitizedChildren.length < vNode.children.length && verboseLogging) {
      const removed = vNode.children.length - sanitizedChildren.length;
      // eslint-disable-next-line no-console
      console.log(`[SVG SANITIZER] Removed ${removed} child element(s) from <${tagName}>`);
    }
  }

  return sanitizedVNode;
};

/**
 * Validates if an SVG string contains potentially dangerous content
 * This is a quick check before full parsing/sanitization
 *
 * @param {string} svgString - Raw SVG string to validate
 * @returns {Object} Validation result with warnings
 */
export const validateSVGString = (svgString) => {
  const warnings = [];

  if (!svgString || typeof svgString !== 'string') {
    return { valid: false, warnings: ['Invalid or empty SVG string'] };
  }

  // Check for script tags
  if (/<script[\s>]/i.test(svgString)) {
    warnings.push('Contains <script> tag');
  }

  // Check for event handlers
  if (/\son[a-z]+\s*=/i.test(svgString)) {
    warnings.push('Contains event handler attributes (onclick, onload, etc.)');
  }

  // Check for javascript: protocol
  if (/javascript:/i.test(svgString)) {
    warnings.push('Contains javascript: protocol');
  }

  // Check for foreignObject
  if (/<foreignObject[\s>]/i.test(svgString)) {
    warnings.push('Contains <foreignObject> element');
  }

  // Check for data: protocol (potentially dangerous in some contexts)
  if (/data:text\/html/i.test(svgString)) {
    warnings.push('Contains data:text/html URI (potential XSS vector)');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
};

export default {
  sanitizeSVGVNode,
  validateSVGString,
  ALLOWED_ELEMENTS,
  ALLOWED_ATTRIBUTES,
  DISALLOWED_ELEMENTS,
};
