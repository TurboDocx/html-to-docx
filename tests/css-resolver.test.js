/**
 * Unit tests for the CSS stylesheet resolver (css-resolver.js).
 *
 * The resolver folds a CSS stylesheet (passed via documentOptions.css and/or
 * embedded <style> tags) into each matched element's inline `style` attribute
 * BEFORE the VDOM is built. Everything downstream (xml-builder) already reads
 * only vNode.properties.style, so resolving here is the minimal-diff path.
 *
 * These tests exercise the public parser contract (convertHTML) plus the
 * resolver's cascade logic directly.
 */

import createHTMLtoVDOM from '../src/helpers/html-parser.js';
import { applyStylesheet, extractAndStripStyleTags } from '../src/helpers/css-resolver.js';
import { parseDocument } from 'htmlparser2';
import { selectAll } from 'css-select';

const convertHTML = createHTMLtoVDOM();

/** Depth-first search for the first VNode with the given tag name. */
function findNode(vtree, tagName) {
  const stack = Array.isArray(vtree) ? [...vtree] : [vtree];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue; // eslint-disable-line no-continue
    if (node.tagName === tagName) return node;
    if (node.children) stack.push(...node.children);
  }
  return null;
}

/** Collect every tag name present in a vtree. */
function collectTagNames(vtree) {
  const names = [];
  const stack = Array.isArray(vtree) ? [...vtree] : [vtree];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue; // eslint-disable-line no-continue
    if (node.tagName) names.push(node.tagName);
    if (node.children) stack.push(...node.children);
  }
  return names;
}

const styleOf = (node) => (node && node.properties && node.properties.style) || {};

describe('CSS resolver - selector support via convertHTML', () => {
  test('type selector applies to matching element', () => {
    const vtree = convertHTML({ css: 'p { color: red; }' }, '<p>hello</p>');
    expect(styleOf(findNode(vtree, 'p')).color).toBe('red');
  });

  test('class selector applies to matching element', () => {
    const vtree = convertHTML({ css: '.brand { color: blue; }' }, '<p class="brand">hi</p>');
    expect(styleOf(findNode(vtree, 'p')).color).toBe('blue');
  });

  test('id selector applies to matching element', () => {
    const vtree = convertHTML({ css: '#lead { color: green; }' }, '<p id="lead">hi</p>');
    expect(styleOf(findNode(vtree, 'p')).color).toBe('green');
  });

  test('descendant selector applies only to nested match', () => {
    const vtree = convertHTML(
      { css: 'div span { color: orange; }' },
      '<div><span>in</span></div><span>out</span>'
    );
    const div = findNode(vtree, 'div');
    const innerSpan = findNode(div, 'span');
    expect(styleOf(innerSpan).color).toBe('orange');
  });

  test('grouped selectors apply to all listed elements', () => {
    const vtree = convertHTML(
      { css: 'h1, h2 { text-align: center; }' },
      '<h1>a</h1><h2>b</h2>'
    );
    expect(styleOf(findNode(vtree, 'h1'))['text-align']).toBe('center');
    expect(styleOf(findNode(vtree, 'h2'))['text-align']).toBe('center');
  });

  test('no css and no <style> leaves elements untouched', () => {
    const vtree = convertHTML({}, '<p>hi</p>');
    expect(styleOf(findNode(vtree, 'p'))).toEqual({});
  });
});

describe('CSS resolver - cascade and specificity', () => {
  test('higher specificity wins regardless of source order', () => {
    // type rule appears AFTER the class rule but is LESS specific -> class wins
    const css = '.brand { color: red; } p { color: blue; }';
    const vtree = convertHTML({ css }, '<p class="brand">x</p>');
    expect(styleOf(findNode(vtree, 'p')).color).toBe('red');
  });

  test('id beats class for the same property', () => {
    const css = '#x { color: green; } .brand { color: red; }';
    const vtree = convertHTML({ css }, '<p id="x" class="brand">x</p>');
    expect(styleOf(findNode(vtree, 'p')).color).toBe('green');
  });

  test('equal specificity resolves by later source order', () => {
    const css = '.a { color: red; } .b { color: blue; }';
    const vtree = convertHTML({ css }, '<p class="a b">x</p>');
    expect(styleOf(findNode(vtree, 'p')).color).toBe('blue');
  });

  test('inline style wins over a matching stylesheet rule', () => {
    const css = 'p { color: red; }';
    const vtree = convertHTML({ css }, '<p style="color: purple;">x</p>');
    expect(styleOf(findNode(vtree, 'p')).color).toBe('purple');
  });

  test('stylesheet fills properties the inline style does not set', () => {
    const css = 'p { color: red; text-align: center; }';
    const vtree = convertHTML({ css }, '<p style="color: purple;">x</p>');
    const style = styleOf(findNode(vtree, 'p'));
    expect(style.color).toBe('purple'); // inline wins
    expect(style['text-align']).toBe('center'); // stylesheet fills the gap
  });
});

describe('CSS resolver - embedded <style> tags', () => {
  test('<style> rules are applied to the document body', () => {
    const html = '<style>p { color: teal; }</style><p>hi</p>';
    const vtree = convertHTML({}, html);
    expect(styleOf(findNode(vtree, 'p')).color).toBe('teal');
  });

  test('<style> element is stripped so its text does not leak as content', () => {
    const html = '<style>p { color: teal; }</style><p>hi</p>';
    const vtree = convertHTML({}, html);
    expect(collectTagNames(vtree)).not.toContain('style');
  });

  test('attached css and <style> combine; <style> wins ties by source order', () => {
    // attached sheet is treated as appearing BEFORE embedded <style>
    const html = '<style>p { color: blue; }</style><p>hi</p>';
    const vtree = convertHTML({ css: 'p { color: red; }' }, html);
    expect(styleOf(findNode(vtree, 'p')).color).toBe('blue');
  });
});

describe('CSS resolver - robustness', () => {
  test('malformed css does not throw and valid rules still apply', () => {
    // `background` is a malformed declaration (no value); css-tree recovers at
    // the rule boundary, so both rules must still apply.
    const css = 'p { color: red; background } .brand { color: blue; }';
    let vtree;
    expect(() => {
      vtree = convertHTML({ css }, '<p>a</p><span class="brand">b</span>');
    }).not.toThrow();
    expect(styleOf(findNode(vtree, 'p')).color).toBe('red');
    expect(styleOf(findNode(vtree, 'span')).color).toBe('blue');
  });

  test('an unparseable selector is skipped and other rules still apply', () => {
    const css = ':::garbage { color: red; } p { color: green; }';
    let vtree;
    expect(() => {
      vtree = convertHTML({ css }, '<p>a</p>');
    }).not.toThrow();
    expect(styleOf(findNode(vtree, 'p')).color).toBe('green');
  });

  test('empty css string is a no-op', () => {
    const vtree = convertHTML({ css: '' }, '<p>hi</p>');
    expect(styleOf(findNode(vtree, 'p'))).toEqual({});
  });
});

describe('CSS resolver - module API (applyStylesheet / extractAndStripStyleTags)', () => {
  test('applyStylesheet mutates matched node style attribute', () => {
    const dom = parseDocument('<p class="brand">hi</p>');
    applyStylesheet({ dom, css: '.brand { color: red; }' });
    const [p] = selectAll('p', dom);
    expect(p.attribs.style).toContain('color: red');
  });

  test('extractAndStripStyleTags returns css text and removes the node', () => {
    const dom = parseDocument('<style>p{color:red}</style><p>hi</p>');
    const css = extractAndStripStyleTags({ dom });
    expect(css).toContain('color:red');
    expect(selectAll('style', dom)).toHaveLength(0);
  });
});
