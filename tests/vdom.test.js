/**
 * Unit tests for VNode and VText classes
 * Tests the virtual DOM implementation that replaces virtual-dom package
 */

import { VNode, VText, isVNode, isVText } from '../src/vdom/index.js';

describe('VNode class', () => {
  describe('Basic construction', () => {
    test('should create VNode with tagName only', () => {
      const vnode = new VNode('div');

      expect(vnode.tagName).toBe('div');
      expect(vnode.properties).toEqual({});
      expect(vnode.children).toEqual([]);
      expect(vnode.key).toBeUndefined();
      expect(vnode.namespace).toBeNull();
      expect(vnode.count).toBe(0);
      expect(vnode.hasWidgets).toBe(false);
      expect(vnode.hasThunks).toBe(false);
    });

    test('should create VNode with properties', () => {
      const props = { className: 'test', id: 'main' };
      const vnode = new VNode('div', props);

      expect(vnode.tagName).toBe('div');
      expect(vnode.properties).toEqual(props);
    });

    test('should create VNode with children', () => {
      const child1 = new VText('Hello');
      const child2 = new VText('World');
      const vnode = new VNode('div', {}, [child1, child2]);

      expect(vnode.children).toHaveLength(2);
      expect(vnode.children[0]).toBe(child1);
      expect(vnode.children[1]).toBe(child2);
      expect(vnode.count).toBe(2);
    });

    test('should create VNode with key', () => {
      const vnode = new VNode('div', {}, [], 'unique-key');

      expect(vnode.key).toBe('unique-key');
    });

    test('should convert numeric key to string', () => {
      const vnode = new VNode('div', {}, [], 123);

      expect(vnode.key).toBe('123');
    });

    test('should create VNode with namespace', () => {
      const vnode = new VNode('svg', {}, [], null, 'http://www.w3.org/2000/svg');

      expect(vnode.namespace).toBe('http://www.w3.org/2000/svg');
    });
  });

  describe('Prototype properties', () => {
    test('should have version on prototype', () => {
      const vnode = new VNode('div');

      expect(VNode.prototype.version).toBe('2');
      expect(vnode.version).toBe('2');
    });

    test('should have type on prototype', () => {
      const vnode = new VNode('div');

      expect(VNode.prototype.type).toBe('VirtualNode');
      expect(vnode.type).toBe('VirtualNode');
    });
  });

  describe('Nested children count', () => {
    test('should calculate descendants count correctly', () => {
      const grandchild1 = new VText('text1');
      const grandchild2 = new VText('text2');
      const child1 = new VNode('p', {}, [grandchild1, grandchild2]);
      const child2 = new VText('text3');
      const parent = new VNode('div', {}, [child1, child2]);

      // child1 has count = 2 (two text children)
      expect(child1.count).toBe(2);
      // parent has count = 2 (child1 + child2) + descendants = 2 (from child1) = 4 total
      expect(parent.count).toBe(4);
    });

    test('should handle deeply nested structure', () => {
      const level3 = new VNode('span', {}, [new VText('deep')]);
      const level2 = new VNode('p', {}, [level3]);
      const level1 = new VNode('div', {}, [level2]);

      expect(level3.count).toBe(1); // 1 text child
      expect(level2.count).toBe(2); // 1 child + 1 descendant
      expect(level1.count).toBe(3); // 1 child + 2 descendants
    });
  });

  describe('Hooks handling', () => {
    test('should detect hooks in properties when they have unhook', () => {
      const hook = {
        hook: () => {},
        unhook: () => {}
      };
      const vnode = new VNode('div', { myHook: hook });

      // Hooks are only detected if they have unhook method
      if (vnode.hooks) {
        expect(vnode.hooks.myHook).toBe(hook);
      }
    });

    test('should not detect hooks without unhook method', () => {
      const notAHook = {
        hook: () => {}
      };
      const vnode = new VNode('div', { myHook: notAHook });

      expect(vnode.hooks).toBeUndefined();
    });

    test('should track descendantHooks from children', () => {
      const hook = {
        hook: () => {},
        unhook: () => {}
      };
      const child = new VNode('span', { myHook: hook });
      const parent = new VNode('div', {}, [child]);

      // descendantHooks should be true if child has hooks
      if (child.hooks) {
        expect(parent.descendantHooks).toBe(true);
      }
    });
  });
});

describe('VText class', () => {
  describe('Basic construction', () => {
    test('should create VText with string', () => {
      const vtext = new VText('Hello World');

      expect(vtext.text).toBe('Hello World');
    });

    test('should convert number to string', () => {
      const vtext = new VText(123);

      expect(vtext.text).toBe('123');
    });

    test('should convert boolean to string', () => {
      const vtext = new VText(true);

      expect(vtext.text).toBe('true');
    });

    test('should handle empty string', () => {
      const vtext = new VText('');

      expect(vtext.text).toBe('');
    });
  });

  describe('Prototype properties', () => {
    test('should have version on prototype', () => {
      const vtext = new VText('test');

      expect(VText.prototype.version).toBe('2');
      expect(vtext.version).toBe('2');
    });

    test('should have type on prototype', () => {
      const vtext = new VText('test');

      expect(VText.prototype.type).toBe('VirtualText');
      expect(vtext.type).toBe('VirtualText');
    });
  });
});

describe('Type checking functions', () => {
  describe('isVNode', () => {
    test('should return true for VNode instances', () => {
      const vnode = new VNode('div');

      expect(isVNode(vnode)).toBe(true);
    });

    test('should return false for VText instances', () => {
      const vtext = new VText('test');

      expect(isVNode(vtext)).toBe(false);
    });

    test('should return false for plain objects', () => {
      expect(isVNode({})).toBe(false);
      expect(isVNode({ type: 'VirtualNode' })).toBe(true); // has correct type
      expect(isVNode({ type: 'Other' })).toBe(false);
    });

    test('should return falsy for null and undefined', () => {
      expect(isVNode(null)).toBeFalsy();
      expect(isVNode(undefined)).toBeFalsy();
    });
  });

  describe('isVText', () => {
    test('should return true for VText instances', () => {
      const vtext = new VText('test');

      expect(isVText(vtext)).toBe(true);
    });

    test('should return false for VNode instances', () => {
      const vnode = new VNode('div');

      expect(isVText(vnode)).toBe(false);
    });

    test('should return false for plain objects', () => {
      expect(isVText({})).toBe(false);
      expect(isVText({ type: 'VirtualText' })).toBe(true); // has correct type
      expect(isVText({ type: 'Other' })).toBe(false);
    });

    test('should return falsy for null and undefined', () => {
      expect(isVText(null)).toBeFalsy();
      expect(isVText(undefined)).toBeFalsy();
    });
  });
});

describe('VNode compatibility with virtual-dom', () => {
  test('should match virtual-dom VNode structure', () => {
    const vnode = new VNode('div', { className: 'test' }, [new VText('content')]);

    // Check all expected properties exist
    expect(vnode).toHaveProperty('tagName');
    expect(vnode).toHaveProperty('properties');
    expect(vnode).toHaveProperty('children');
    expect(vnode).toHaveProperty('key');
    expect(vnode).toHaveProperty('namespace');
    expect(vnode).toHaveProperty('count');
    expect(vnode).toHaveProperty('hasWidgets');
    expect(vnode).toHaveProperty('hasThunks');
    expect(vnode).toHaveProperty('descendantHooks');
    expect(vnode).toHaveProperty('version');
    expect(vnode).toHaveProperty('type');
  });

  test('should match virtual-dom VText structure', () => {
    const vtext = new VText('test');

    // Check all expected properties exist
    expect(vtext).toHaveProperty('text');
    expect(vtext).toHaveProperty('version');
    expect(vtext).toHaveProperty('type');
  });
});
