"use strict";

// eslint-module-utils/pkgUp.js and readPkgUp.js 2.12.0 (MIT, see LICENSE).
const fs = require("node:fs");
const path = require("node:path");

function findUp(filename, cwd) {
  let dir = path.resolve(cwd || "");
  const root = path.parse(dir).root;
  const filenames = [].concat(filename);

  while (true) {
    const file = filenames.find((el) => fs.existsSync(path.resolve(dir, el)));
    if (file) {
      return path.join(dir, file);
    }
    if (dir === root) {
      return null;
    }
    dir = path.dirname(dir);
  }
}

function pkgUp(opts) {
  return findUp("package.json", opts && opts.cwd);
}

function stripBOM(str) {
  return str.replace(/^﻿/, "");
}

function readPkgUp(opts) {
  const fp = pkgUp(opts);
  if (!fp) {
    return {};
  }
  try {
    return {
      pkg: JSON.parse(stripBOM(fs.readFileSync(fp, { encoding: "utf-8" }))),
      path: fp,
    };
  } catch {
    return {};
  }
}

module.exports = { pkgUp, readPkgUp };
