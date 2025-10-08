/* eslint-disable no-restricted-syntax, no-continue, import/extensions, prefer-destructuring */
/**
 * HTML to Virtual DOM Parser
 *
 * Converts HTML strings to virtual DOM trees using htmlparser2 for parsing.
 * This implementation replaces the unmaintained html-to-v package while
 * maintaining full API compatibility.
 *
 * Based on React's HTML DOM property configuration and HTML parser libraries.
 */

import * as htmlparser2 from 'htmlparser2';
import { decode } from 'html-entities';
import { VNode, VText } from '../vdom/index.js';

// ============================================================================
// Property Info System
// Configuration from the old virtual DOM library (originally from React's HTMLDOMPropertyConfig)
// This distinguishes HTML properties from attributes for correct VNode generation
// ============================================================================

// Property masks for attribute/property classification
/* eslint-disable no-bitwise */
const MUST_USE_ATTRIBUTE = 0x1;
const MUST_USE_PROPERTY = 0x2;
const HAS_BOOLEAN_VALUE = 0x4;
const HAS_NUMERIC_VALUE = 0x8;
const HAS_POSITIVE_NUMERIC_VALUE = 0x10 | 0x8;
const HAS_OVERLOADED_BOOLEAN_VALUE = 0x20;
/* eslint-enable no-bitwise */

// HTML DOM properties configuration
/* eslint-disable no-bitwise */
const Properties = {
  accept: null,
  acceptCharset: null,
  accessKey: null,
  action: null,
  allowFullScreen: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
  allowTransparency: MUST_USE_ATTRIBUTE,
  alt: null,
  async: HAS_BOOLEAN_VALUE,
  autoComplete: null,
  autoFocus: HAS_BOOLEAN_VALUE,
  autoPlay: HAS_BOOLEAN_VALUE,
  capture: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
  cellPadding: null,
  cellSpacing: null,
  charSet: MUST_USE_ATTRIBUTE,
  challenge: MUST_USE_ATTRIBUTE,
  checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  classID: MUST_USE_ATTRIBUTE,
  className: MUST_USE_ATTRIBUTE,
  cols: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
  colSpan: null,
  content: null,
  contentEditable: null,
  contextMenu: MUST_USE_ATTRIBUTE,
  controls: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  coords: null,
  crossOrigin: null,
  data: null,
  dateTime: MUST_USE_ATTRIBUTE,
  defer: HAS_BOOLEAN_VALUE,
  dir: null,
  disabled: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
  download: HAS_OVERLOADED_BOOLEAN_VALUE,
  draggable: null,
  encType: null,
  form: MUST_USE_ATTRIBUTE,
  formAction: MUST_USE_ATTRIBUTE,
  formEncType: MUST_USE_ATTRIBUTE,
  formMethod: MUST_USE_ATTRIBUTE,
  formNoValidate: HAS_BOOLEAN_VALUE,
  formTarget: MUST_USE_ATTRIBUTE,
  frameBorder: MUST_USE_ATTRIBUTE,
  headers: null,
  height: MUST_USE_ATTRIBUTE,
  hidden: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
  high: null,
  href: null,
  hrefLang: null,
  htmlFor: null,
  httpEquiv: null,
  icon: null,
  id: MUST_USE_PROPERTY,
  is: MUST_USE_ATTRIBUTE,
  keyParams: MUST_USE_ATTRIBUTE,
  keyType: MUST_USE_ATTRIBUTE,
  label: null,
  lang: null,
  list: MUST_USE_ATTRIBUTE,
  loop: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  low: null,
  manifest: MUST_USE_ATTRIBUTE,
  marginHeight: null,
  marginWidth: null,
  max: null,
  maxLength: MUST_USE_ATTRIBUTE,
  media: MUST_USE_ATTRIBUTE,
  mediaGroup: null,
  method: null,
  min: null,
  minLength: MUST_USE_ATTRIBUTE,
  multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  name: null,
  noValidate: HAS_BOOLEAN_VALUE,
  open: HAS_BOOLEAN_VALUE,
  optimum: null,
  pattern: null,
  placeholder: null,
  poster: null,
  preload: null,
  radioGroup: null,
  readOnly: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  rel: null,
  required: HAS_BOOLEAN_VALUE,
  role: MUST_USE_ATTRIBUTE,
  rows: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
  rowSpan: null,
  sandbox: null,
  scope: null,
  scoped: HAS_BOOLEAN_VALUE,
  scrolling: null,
  seamless: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
  selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
  shape: null,
  size: MUST_USE_ATTRIBUTE | HAS_POSITIVE_NUMERIC_VALUE,
  sizes: MUST_USE_ATTRIBUTE,
  span: HAS_POSITIVE_NUMERIC_VALUE,
  spellCheck: null,
  src: null,
  srcDoc: MUST_USE_PROPERTY,
  srcSet: MUST_USE_ATTRIBUTE,
  start: HAS_NUMERIC_VALUE,
  step: null,
  style: null,
  tabIndex: null,
  target: null,
  title: null,
  type: null,
  useMap: null,
  value: MUST_USE_PROPERTY,
  width: MUST_USE_ATTRIBUTE,
  wmode: MUST_USE_ATTRIBUTE,
  autoCapitalize: null,
  autoCorrect: null,
  itemProp: MUST_USE_ATTRIBUTE,
  itemScope: MUST_USE_ATTRIBUTE | HAS_BOOLEAN_VALUE,
  itemType: MUST_USE_ATTRIBUTE,
  itemID: MUST_USE_ATTRIBUTE,
  itemRef: MUST_USE_ATTRIBUTE,
  property: null,
  unselectable: MUST_USE_ATTRIBUTE,
};
/* eslint-enable no-bitwise */

const PropertyToAttributeMapping = {
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
  acceptCharset: 'accept-charset',
};

function checkMask(value, bitmask) {
  // eslint-disable-next-line no-bitwise
  return (value & bitmask) === bitmask;
}

// Build property info lookup table
const propInfoByAttributeName = {};
Object.keys(Properties).forEach((propName) => {
  const propConfig = Properties[propName];
  const attributeName = PropertyToAttributeMapping[propName] || propName.toLowerCase();

  const propertyInfo = {
    attributeName,
    propertyName: propName,
    mustUseAttribute: checkMask(propConfig, MUST_USE_ATTRIBUTE),
    mustUseProperty: checkMask(propConfig, MUST_USE_PROPERTY),
    hasBooleanValue: checkMask(propConfig, HAS_BOOLEAN_VALUE),
    hasNumericValue: checkMask(propConfig, HAS_NUMERIC_VALUE),
    hasPositiveNumericValue: checkMask(propConfig, HAS_POSITIVE_NUMERIC_VALUE),
    hasOverloadedBooleanValue: checkMask(propConfig, HAS_OVERLOADED_BOOLEAN_VALUE),
  };

  propInfoByAttributeName[attributeName] = propertyInfo;
});

function getPropertyInfo(attributeName) {
  const lowerCased = attributeName.toLowerCase();

  if (Object.prototype.hasOwnProperty.call(propInfoByAttributeName, lowerCased)) {
    return propInfoByAttributeName[lowerCased];
  }

  // Custom attribute
  return {
    attributeName,
    mustUseAttribute: true,
    isCustomAttribute: true,
  };
}

// ============================================================================
// Property Setters
// ============================================================================

/**
 * Parse CSS style string into object
 */
function parseStyles(input) {
  const attributes = input.split(';');
  const styles = attributes.reduce((object, attribute) => {
    const entry = attribute.split(/:(.*)/);
    if (entry[0] && entry[1]) {
      object[entry[0].trim()] = entry[1].trim();
    }
    return object;
  }, {});
  return styles;
}

const propertyValueConversions = {
  style: parseStyles,
  placeholder: decode,
  title: decode,
  alt: decode,
};

function propertyIsTrue(propInfo, value) {
  if (propInfo.hasBooleanValue) {
    return value === '' || value.toLowerCase() === propInfo.attributeName;
  }
  if (propInfo.hasOverloadedBooleanValue) {
    return value === '';
  }
  return false;
}

function getPropertyValue(propInfo, value) {
  const isTrue = propertyIsTrue(propInfo, value);
  if (propInfo.hasBooleanValue) {
    return !!isTrue;
  }
  if (propInfo.hasOverloadedBooleanValue) {
    return isTrue ? true : value;
  }
  if (propInfo.hasNumericValue || propInfo.hasPositiveNumericValue) {
    return Number(value);
  }
  return value;
}

function setVNodeProperty(properties, propInfo, value) {
  const propName = propInfo.propertyName;
  let valueConverter;

  if (propName && Object.prototype.hasOwnProperty.call(propertyValueConversions, propName)) {
    valueConverter = propertyValueConversions[propInfo.propertyName];
    value = valueConverter(value);
  }

  properties[propInfo.propertyName] = getPropertyValue(propInfo, value);
}

function getAttributeValue(propInfo, value) {
  if (propInfo.hasBooleanValue) {
    return '';
  }
  return value;
}

function setVNodeAttribute(properties, propInfo, value) {
  properties.attributes[propInfo.attributeName] = getAttributeValue(propInfo, value);
}

function getPropertySetter(propInfo) {
  if (propInfo.mustUseAttribute) {
    return { set: setVNodeAttribute };
  }
  return { set: setVNodeProperty };
}

/**
 * Convert tag attributes to VNode properties
 */
function convertTagAttributes(tag) {
  const attributes = tag.attribs;
  const vNodeProperties = {
    attributes: {},
  };

  Object.keys(attributes).forEach((attributeName) => {
    const value = attributes[attributeName];
    const propInfo = getPropertyInfo(attributeName);
    const propertySetter = getPropertySetter(propInfo);
    propertySetter.set(vNodeProperties, propInfo, value);
  });

  return vNodeProperties;
}

// ============================================================================
// HTML Parser to VDOM Converter
// ============================================================================

function createConverter(VNodeClass, VTextClass) {
  const converter = {
    convert(node, getVNodeKey) {
      if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
        return converter.convertTag(node, getVNodeKey);
      }
      if (node.type === 'text') {
        return new VTextClass(decode(node.data));
      }
      // Converting an unsupported node, return an empty text node instead
      return new VTextClass('');
    },

    convertTag(tag, getVNodeKey) {
      const attributes = convertTagAttributes(tag);
      let key;

      if (getVNodeKey) {
        key = getVNodeKey(attributes);
      }

      const children = Array.prototype.map.call(tag.children || [], (node) =>
        converter.convert(node, getVNodeKey)
      );

      return new VNodeClass(tag.name, attributes, children, key);
    },
  };
  return converter;
}

/**
 * Parse HTML string into DOM nodes
 *
 * NOTE: htmlparser2 v10.0.0 auto-decodes entities by default.
 * We set decodeEntities: false to match v3.9.0 behavior,
 * then manually decode using html-entities.
 */
function parseHTML(html) {
  const handler = new htmlparser2.DomHandler();
  const parser = new htmlparser2.Parser(handler, {
    lowerCaseAttributeNames: false,
    decodeEntities: false, // Required for htmlparser2 v10.0.0 compatibility
  });
  parser.parseComplete(html);
  return handler.dom;
}

/**
 * Main converter function
 */
function convertHTML(options, html) {
  // Support both (options, html) and (html) signatures
  let opts = options;
  let htmlString = html;

  if (typeof options === 'string') {
    htmlString = options;
    opts = {};
  }

  const converter = createConverter(VNode, VText);
  const tags = parseHTML(htmlString);

  let convertedHTML;
  if (tags.length === 0) {
    // Empty HTML
    convertedHTML = new VText('');
  } else if (tags.length > 1) {
    convertedHTML = tags.map((tag) => converter.convert(tag, opts.getVNodeKey));
  } else {
    convertedHTML = converter.convert(tags[0], opts.getVNodeKey);
  }

  return convertedHTML;
}

/**
 * Factory function for HTML to VNode conversion
 */
export default function createHTMLtoVDOM() {
  return convertHTML;
}
