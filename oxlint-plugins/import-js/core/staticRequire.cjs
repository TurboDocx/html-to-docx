"use strict";

// eslint-plugin-import 2.31.0 src/core/staticRequire.js (MIT, see LICENSE).
module.exports = function isStaticRequire(node) {
  return node
    && node.callee
    && node.callee.type === "Identifier"
    && node.callee.name === "require"
    && node.arguments.length === 1
    && node.arguments[0].type === "Literal"
    && typeof node.arguments[0].value === "string";
};
