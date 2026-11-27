"use strict";

// eslint-plugin-import 2.31.0 src/rules/no-unresolved.js (MIT, see LICENSE).
// Ensures that an imported path exists, given resolution rules.
const { CASE_SENSITIVE_FS, fileExistsWithCaseSync, resolve } = require("../utils/resolve.cjs");
const moduleVisitor = require("../utils/moduleVisitor.cjs");

module.exports = {
  meta: {
    type: "problem",
    docs: {
      category: "Static analysis",
      description: "Ensure imports point to a file/module that can be resolved.",
      url: "https://github.com/import-js/eslint-plugin-import/blob/v2.31.0/docs/rules/no-unresolved.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          commonjs: { type: "boolean" },
          amd: { type: "boolean" },
          esmodule: { type: "boolean" },
          ignore: { type: "array", minItems: 1, items: { type: "string" }, uniqueItems: true },
          caseSensitive: { type: "boolean", default: true },
          caseSensitiveStrict: { type: "boolean", default: false },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};

    function checkSourceValue(source, node) {
      // ignore type-only imports and exports
      if (node.importKind === "type" || node.exportKind === "type") {
        return;
      }

      const caseSensitive = !CASE_SENSITIVE_FS && options.caseSensitive !== false;
      const caseSensitiveStrict = !CASE_SENSITIVE_FS && options.caseSensitiveStrict;

      const resolvedPath = resolve(source.value, context);

      if (resolvedPath === undefined) {
        context.report({ node: source, message: `Unable to resolve path to module '${source.value}'.` });
      } else if (caseSensitive || caseSensitiveStrict) {
        if (!fileExistsWithCaseSync(resolvedPath, caseSensitiveStrict)) {
          context.report({ node: source, message: `Casing of ${source.value} does not match the underlying filesystem.` });
        }
      }
    }

    return moduleVisitor(checkSourceValue, options);
  },
};
