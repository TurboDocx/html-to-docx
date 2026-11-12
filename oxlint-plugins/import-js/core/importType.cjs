"use strict";

// eslint-plugin-import 2.31.0 src/core/importType.js (MIT, see LICENSE). is-core-module is replaced
// by Node's own module.isBuiltin, and typeTest no longer passes settings and path to the helpers that
// only take the name.
const { isBuiltin: isCoreModule } = require("node:module");
const { isAbsolute: nodeIsAbsolute, relative, resolve: nodeResolve } = require("node:path");

const { resolve } = require("../utils/resolve.cjs");
const { getContextPackagePath } = require("./packagePath.cjs");

const scopedRegExp = /^@[^/]+\/?[^/]+/;
function isScoped(name) {
  return name && scopedRegExp.test(name);
}

function baseModule(name) {
  if (isScoped(name)) {
    const [scope, pkg] = name.split("/");
    return `${scope}/${pkg}`;
  }
  const [pkg] = name.split("/");
  return pkg;
}

function isInternalRegexMatch(name, settings) {
  const internalScope = settings && settings["import/internal-regex"];
  return internalScope && new RegExp(internalScope).test(name);
}

function isAbsolute(name) {
  return typeof name === "string" && nodeIsAbsolute(name);
}

// path is defined only when a resolver resolves to a non-standard path
function isBuiltIn(name, settings, path) {
  if (path || !name) { return false; }
  const base = baseModule(name);
  const extras = settings && settings["import/core-modules"] || [];
  return isCoreModule(base) || extras.indexOf(base) > -1;
}

const moduleRegExp = /^\w/;
function isModule(name) {
  return name && moduleRegExp.test(name);
}

function isRelativeToParent(name) {
  return (/^\.\.$|^\.\.[\\/]/).test(name);
}
const indexFiles = [".", "./", "./index", "./index.js"];
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1;
}

function isRelativeToSibling(name) {
  return (/^\.[\\/]/).test(name);
}

function isExternalPath(path, context) {
  if (!path) {
    return false;
  }

  const { settings } = context;
  const packagePath = getContextPackagePath(context);

  if (relative(packagePath, path).startsWith("..")) {
    return true;
  }

  const folders = settings && settings["import/external-module-folders"] || ["node_modules"];
  return folders.some((folder) => {
    const folderPath = nodeResolve(packagePath, folder);
    const relativePath = relative(folderPath, path);
    return !relativePath.startsWith("..");
  });
}

function isInternalPath(path, context) {
  if (!path) {
    return false;
  }
  const packagePath = getContextPackagePath(context);
  return !relative(packagePath, path).startsWith("../");
}

function isExternalLookingName(name) {
  return isModule(name) || isScoped(name);
}

function typeTest(name, context, path) {
  const { settings } = context;
  if (isInternalRegexMatch(name, settings)) { return "internal"; }
  if (isAbsolute(name)) { return "absolute"; }
  if (isBuiltIn(name, settings, path)) { return "builtin"; }
  if (isRelativeToParent(name)) { return "parent"; }
  if (isIndex(name)) { return "index"; }
  if (isRelativeToSibling(name)) { return "sibling"; }
  if (isExternalPath(path, context)) { return "external"; }
  if (isInternalPath(path, context)) { return "internal"; }
  if (isExternalLookingName(name)) { return "external"; }
  return "unknown";
}

module.exports = function resolveImportType(name, context) {
  return typeTest(name, context, resolve(name, context));
};
