import { isVNode } from '../vdom/index';

// CSS properties that inherit from an element to its descendants and that the
// builder knows how to render. Box properties such as margin, padding,
// background, border, width and page-break-* do NOT inherit in CSS and are
// intentionally left out.
const INHERITED_STYLE_KEYS = [
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'text-align',
  'text-shadow',
  'text-transform',
];

// Elements whose browser default stylesheet sets one of the inherited
// properties, so an inherited value must not replace that default: headings
// get a larger font-size and <pre> gets a monospace font. Their own inline
// style still applies.
const TAG_DEFAULT_STYLE_KEYS = {
  h1: ['font-size'],
  h2: ['font-size'],
  h3: ['font-size'],
  h4: ['font-size'],
  h5: ['font-size'],
  h6: ['font-size'],
  pre: ['font-family'],
};

// The subset of `style` that descendants inherit, or null if there is none.
export const pickInheritedStyles = (style) => {
  if (!style) return null;
  const inherited = {};
  INHERITED_STYLE_KEYS.forEach((key) => {
    if (style[key] !== undefined && style[key] !== '') {
      inherited[key] = style[key];
    }
  });
  return Object.keys(inherited).length > 0 ? inherited : null;
};

// Cascades `inherited` styles onto `vNode` in place: the node's own styles win,
// and tag defaults (see TAG_DEFAULT_STYLE_KEYS) are not overridden. Mutating is
// safe because each render parses its HTML into a fresh tree; a new style
// object is assigned rather than editing a possibly shared one.
export const applyInheritedStyles = (vNode, inherited) => {
  if (!inherited || !isVNode(vNode)) return vNode;
  const blocked = TAG_DEFAULT_STYLE_KEYS[vNode.tagName] || [];
  const applicable = Object.fromEntries(
    Object.entries(inherited).filter(([key]) => !blocked.includes(key))
  );
  if (!vNode.properties) vNode.properties = {};
  vNode.properties.style = { ...applicable, ...vNode.properties.style };
  return vNode;
};
