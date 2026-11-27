"use strict";

// eslint-plugin-import 2.31.0 src/core/packagePath.js (MIT, see LICENSE).
const { dirname } = require("node:path");
const { pkgUp, readPkgUp } = require("../utils/pkgUp.cjs");

function getFilePackagePath(filePath) {
  const fp = pkgUp({ cwd: filePath });
  return dirname(fp);
}

function getContextPackagePath(context) {
  return getFilePackagePath(context.physicalFilename || context.filename);
}

function getFilePackageName(filePath) {
  const { pkg, path } = readPkgUp({ cwd: filePath, normalize: false });
  if (pkg) {
    // recursion in case of intermediate esm package.json without name found
    return pkg.name || getFilePackageName(dirname(dirname(path)));
  }
  return null;
}

module.exports = { getContextPackagePath, getFilePackageName, getFilePackagePath };
