/**
 * Setup script to mock the ID generator for deterministic DOCX output in tests.
 * This should be imported before running any tests that generate DOCX files.
 *
 * Usage in test/CI:
 *   node -r ./scripts/setup-deterministic-test.js example/example-node.js
 */

const Module = require('module');
const originalRequire = Module.prototype.require;

// Counter for deterministic IDs
let idCounter = 0;

Module.prototype.require = function (id) {
  const module = originalRequire.apply(this, arguments);

  // Mock the id-generator module
  if (id.endsWith('/utils/id-generator') || id.endsWith('/utils/id-generator.js')) {
    return {
      generateMediaId: () => {
        const id = idCounter.toString();
        idCounter += 1;
        return id;
      },
      createDeterministicIdGenerator: () => {
        let counter = 0;
        return () => {
          const id = counter.toString();
          counter += 1;
          return id;
        };
      },
    };
  }

  return module;
};

console.log('[DETERMINISTIC MODE] ID generator mocked for reproducible output');
