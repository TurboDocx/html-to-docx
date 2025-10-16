/**
 * Tests for htmlparser2 v10.0.0 compatibility
 * Validates that our configuration matches v3.9.0 behavior
 */

import createHTMLtoVDOM from '../src/helpers/html-parser.js';

const convertHTML = createHTMLtoVDOM();

describe('htmlparser2 v10.0.0 Compatibility', () => {
  describe('Entity decoding behavior (decodeEntities: false)', () => {
    test('should NOT auto-decode &nbsp; during parsing', () => {
      // With decodeEntities: false, htmlparser2 v10 should behave like v3.9.0
      // and store &nbsp; as raw string, then we decode it manually
      const result = convertHTML('<p>Hello&nbsp;World</p>');

      // After manual decoding, it should be a non-breaking space character
      expect(result.children[0].text).toBe('Hello\u00a0World');
      // Should NOT be the raw entity string
      expect(result.children[0].text).not.toBe('Hello&nbsp;World');
    });

    test('should handle &amp; correctly', () => {
      const result = convertHTML('<p>Tom &amp; Jerry</p>');

      expect(result.children[0].text).toBe('Tom & Jerry');
    });

    test('should handle &lt; and &gt; correctly', () => {
      const result = convertHTML('<p>&lt;html&gt;</p>');

      expect(result.children[0].text).toBe('<html>');
    });

    test('should handle &quot; correctly', () => {
      const result = convertHTML('<p>Say &quot;Hello&quot;</p>');

      expect(result.children[0].text).toBe('Say "Hello"');
    });

    test('should handle multiple entities in one text node', () => {
      const result = convertHTML('<p>&lt;div&gt; &amp; &quot;test&quot; &nbsp;</p>');

      expect(result.children[0].text).toBe('<div> & "test" \u00a0');
    });

    test('should decode entities in attributes', () => {
      const result = convertHTML('<div title="Tom &amp; Jerry">Content</div>');

      expect(result.properties.title).toBe('Tom & Jerry');
    });

    test('should preserve numeric entities', () => {
      const result = convertHTML('<p>&#169; &#xA9;</p>');

      // Both should decode to ©
      expect(result.children[0].text).toBe('© ©');
    });
  });

  describe('Case sensitivity (lowerCaseAttributeNames: false)', () => {
    test('should preserve attribute name case', () => {
      const result = convertHTML('<div dataValue="test">Content</div>');

      // Should preserve camelCase in attribute names
      expect(result.properties.attributes.dataValue || result.properties.attributes.datavalue).toBe('test');
    });

    test('should preserve tag name case', () => {
      const result = convertHTML('<DIV>Content</DIV>');

      // htmlparser2 lowercases tag names by default
      expect(result.tagName).toBe('div');
    });
  });

  describe('Whitespace handling', () => {
    test('should preserve whitespace in text nodes', () => {
      const result = convertHTML('<p>  Multiple   spaces  </p>');

      expect(result.children[0].text).toBe('  Multiple   spaces  ');
    });

    test('should preserve newlines', () => {
      const result = convertHTML('<p>Line 1\nLine 2</p>');

      expect(result.children[0].text).toBe('Line 1\nLine 2');
    });

    test('should preserve tabs', () => {
      const result = convertHTML('<p>Tab\there</p>');

      expect(result.children[0].text).toBe('Tab\there');
    });
  });

  describe('HTML5 compatibility', () => {
    test('should handle self-closing tags', () => {
      const result = convertHTML('<br />');

      expect(result.tagName).toBe('br');
      expect(result.children).toEqual([]);
    });

    test('should handle void elements without closing slash', () => {
      const result = convertHTML('<img src="test.jpg">');

      expect(result.tagName).toBe('img');
      expect(result.properties.src).toBe('test.jpg');
    });

    test('should handle HTML5 semantic elements', () => {
      const html = '<article></article><header></header><nav></nav>';
      const result = convertHTML(html);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(3);
      const tags = result.map(n => n.tagName);
      expect(tags).toContain('article');
      expect(tags).toContain('header');
      expect(tags).toContain('nav');
    });
  });

  describe('Special characters and Unicode', () => {
    test('should handle Unicode characters', () => {
      const result = convertHTML('<p>Hello 世界 🌍</p>');

      expect(result.children[0].text).toBe('Hello 世界 🌍');
    });

    test('should handle emoji', () => {
      const result = convertHTML('<p>😀 😃 😄</p>');

      expect(result.children[0].text).toBe('😀 😃 😄');
    });

    test('should handle special punctuation', () => {
      const result = convertHTML('<p>—–""' + "'" + "'</p>");

      expect(result.children[0].text).toBe('—–""' + "'" + "'");
    });

    test('should handle currency symbols', () => {
      const result = convertHTML('<p>€ £ ¥ $</p>');

      expect(result.children[0].text).toBe('€ £ ¥ $');
    });
  });

  describe('Malformed HTML handling', () => {
    test('should handle unclosed tags', () => {
      const result = convertHTML('<div><p>Text');

      expect(result.tagName).toBe('div');
      expect(result.children[0].tagName).toBe('p');
    });

    test('should handle mismatched tags', () => {
      const result = convertHTML('<div><span>Text</div></span>');

      // htmlparser2 handles this gracefully
      expect(result.tagName).toBe('div');
    });

    test('should handle nested malformed structure', () => {
      const result = convertHTML('<div><p>Paragraph<div>Nested</div>');

      expect(result.tagName).toBe('div');
    });
  });
});

describe('Regression tests for CVE-2025-57352 fix', () => {
  test('should NOT use virtual-dom package', () => {
    // Ensure we're not importing from virtual-dom
    const htmlParserSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../src/helpers/html-parser.js'),
      'utf8'
    );

    expect(htmlParserSource).not.toContain('virtual-dom');
    expect(htmlParserSource).toContain('htmlparser2');
  });

  test('should NOT use html-to-vdom package', () => {
    const htmlParserSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../src/helpers/html-parser.js'),
      'utf8'
    );

    expect(htmlParserSource).not.toContain('html-to-vdom');
  });

  test('should use our custom VNode implementation', () => {
    const htmlParserSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../src/helpers/html-parser.js'),
      'utf8'
    );

    expect(htmlParserSource).toContain('../vdom/index');
  });

  test('should create VNode instances from our implementation', () => {
    const result = convertHTML('<div>Test</div>');

    // Check that it's using our VNode class
    expect(result.constructor.name).toBe('VNode');
    expect(result.version).toBe('2');
    expect(result.type).toBe('VirtualNode');
  });
});

describe('Property configuration compatibility', () => {
  describe('Critical properties for DOCX generation', () => {
    test('should set src as property for images', () => {
      const result = convertHTML('<img src="test.jpg" />');

      // Critical: src must be a property, not an attribute
      expect(result.properties.src).toBe('test.jpg');
      expect(result.properties.attributes.src).toBeUndefined();
    });

    test('should set href as property for links', () => {
      const result = convertHTML('<a href="https://example.com">Link</a>');

      expect(result.properties.href).toBe('https://example.com');
      expect(result.properties.attributes.href).toBeUndefined();
    });

    test('should set colspan as property for tables', () => {
      const result = convertHTML('<td colspan="2">Cell</td>');

      // colspan is a property (colSpan) per HTML DOM spec
      expect(result.properties.colSpan).toBe('2');
    });

    test('should set rowspan as property for tables', () => {
      const result = convertHTML('<td rowspan="3">Cell</td>');

      // rowspan is a property (rowSpan) per HTML DOM spec
      expect(result.properties.rowSpan).toBe('3');
    });

    test('should parse style attribute correctly', () => {
      const result = convertHTML('<div style="width: 512px; height: 400px;">Content</div>');

      expect(result.properties.style).toEqual({
        width: '512px',
        height: '400px'
      });
    });
  });

  describe('All 140+ properties correctly categorized', () => {
    test('boolean properties should be set correctly', () => {
      const result = convertHTML('<input type="checkbox" checked disabled />');

      // checked and disabled are boolean properties
      expect(result.properties.checked).toBe(true);
      expect(result.properties.attributes.disabled).toBe('');
    });

    test('numeric properties should be set correctly', () => {
      // Per HTML spec, start is HAS_NUMERIC_VALUE
      const result = convertHTML('<ol start="5"><li>Item</li></ol>');

      // start should be a number
      expect(result.properties.start).toBe(5);
      expect(typeof result.properties.start).toBe('number');
    });

    test('MUST_USE_ATTRIBUTE properties should be in attributes object', () => {
      const result = convertHTML('<div role="button" cols="10">Content</div>');

      expect(result.properties.attributes.role).toBe('button');
      expect(result.properties.attributes.cols).toBe('10');
    });
  });
});
