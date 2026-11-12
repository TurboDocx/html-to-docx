"use strict";

// eslint-module-utils/moduleVisitor.js 2.12.0 (MIT, see LICENSE), unchanged apart from the JSDoc.
// Calls `visitor(source, importer)` for every import, export-from, dynamic import(), and (with
// `commonjs`) require() / (with `amd`) define() whose module specifier is a string literal.
module.exports = function visitModules(visitor, options) {
  const ignore = options && options.ignore;
  const amd = !!(options && options.amd);
  const commonjs = !!(options && options.commonjs);
  // if esmodule is not explicitly disabled, it is assumed to be enabled
  const esmodule = !!Object.assign({ esmodule: true }, options).esmodule;

  const ignoreRegExps = ignore == null ? [] : ignore.map((p) => new RegExp(p));

  function checkSourceValue(source, importer) {
    if (source == null) { return; }

    // handle ignore
    if (ignoreRegExps.some((re) => re.test(String(source.value)))) { return; }

    // fire visitor
    visitor(source, importer);
  }

  // for import-y declarations
  function checkSource(node) {
    checkSourceValue(node.source, node);
  }

  // for esmodule dynamic `import()` calls
  function checkImportCall(node) {
    let modulePath;
    if (node.type === "ImportExpression") {
      modulePath = node.source;
    } else if (node.type === "CallExpression") {
      if (node.callee.type !== "Import") { return; }
      if (node.arguments.length !== 1) { return; }

      modulePath = node.arguments[0];
    } else {
      throw new TypeError("this should be unreachable");
    }

    if (modulePath.type !== "Literal") { return; }
    if (typeof modulePath.value !== "string") { return; }

    checkSourceValue(modulePath, node);
  }

  // for CommonJS `require` calls
  function checkCommon(call) {
    if (call.callee.type !== "Identifier") { return; }
    if (call.callee.name !== "require") { return; }
    if (call.arguments.length !== 1) { return; }

    const modulePath = call.arguments[0];
    if (modulePath.type !== "Literal") { return; }
    if (typeof modulePath.value !== "string") { return; }

    checkSourceValue(modulePath, call);
  }

  function checkAMD(call) {
    if (call.callee.type !== "Identifier") { return; }
    if (call.callee.name !== "require" && call.callee.name !== "define") { return; }
    if (call.arguments.length !== 2) { return; }

    const modules = call.arguments[0];
    if (modules.type !== "ArrayExpression") { return; }

    for (const element of modules.elements) {
      if (!element) { continue; }
      if (element.type !== "Literal") { continue; }
      if (typeof element.value !== "string") { continue; }

      if (element.value === "require" || element.value === "exports") {
        continue;
      }

      checkSourceValue(element, element);
    }
  }

  const visitors = {};
  if (esmodule) {
    Object.assign(visitors, {
      ImportDeclaration: checkSource,
      ExportNamedDeclaration: checkSource,
      ExportAllDeclaration: checkSource,
      CallExpression: checkImportCall,
      ImportExpression: checkImportCall,
    });
  }

  if (commonjs || amd) {
    const currentCallExpression = visitors.CallExpression;
    visitors.CallExpression = function (call) {
      if (currentCallExpression) { currentCallExpression(call); }
      if (commonjs) { checkCommon(call); }
      if (amd) { checkAMD(call); }
    };
  }

  return visitors;
};
