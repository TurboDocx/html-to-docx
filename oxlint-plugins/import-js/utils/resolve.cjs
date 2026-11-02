"use strict";

// What eslint-plugin-import's default "node" resolver did: eslint-module-utils/resolve.js 2.12.0
// driving eslint-import-resolver-node 0.3.9, which drives resolve@1 (resolve/lib/sync.js). All MIT, see
// LICENSE and LICENSE-resolve.
// Ported without the resolver plugin loading, since "node" is the only resolver these configs use.
// Like resolve@1, this ignores package.json "exports" and prefers "module" over "main".

const fs = require("node:fs");
const { isBuiltin } = require("node:module");
const path = require("node:path");

const DEFAULT_EXTENSIONS = [".mjs", ".js", ".json", ".node"];

const CASE_SENSITIVE_FS = !fs.existsSync(path.join(__dirname.toUpperCase(), "rESOLVE.CJS"));

function isFile(file) {
  try {
    const stat = fs.statSync(file, { throwIfNoEntry: false });
    return !!stat && (stat.isFile() || stat.isFIFO());
  } catch (e) {
    if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
    throw e;
  }
}

function isDirectory(dir) {
  try {
    const stat = fs.statSync(dir, { throwIfNoEntry: false });
    return !!stat && stat.isDirectory();
  } catch (e) {
    if (e && (e.code === "ENOENT" || e.code === "ENOTDIR")) return false;
    throw e;
  }
}

function readPackage(pkgfile) {
  try {
    return JSON.parse(fs.readFileSync(pkgfile, "utf8"));
  } catch {
    return undefined;
  }
}

function nodeModulesDirs(absoluteStart) {
  const paths = [absoluteStart];
  let parsed = path.parse(absoluteStart);
  while (parsed.dir !== paths[paths.length - 1]) {
    paths.push(parsed.dir);
    parsed = path.parse(parsed.dir);
  }
  return paths.map((aPath) => path.resolve("/", aPath, "node_modules"));
}

// resolve@1's resolveSync(x, { basedir, extensions, packageFilter }), returning undefined when
// resolve would throw MODULE_NOT_FOUND.
function resolveSync(x, basedir, extensions, packageFilter) {
  function loadAsFile(file) {
    if (isFile(file)) return file;
    for (const ext of extensions) {
      if (isFile(file + ext)) return file + ext;
    }
    return undefined;
  }

  function loadAsDirectory(dir) {
    const pkgfile = path.join(dir, "package.json");
    if (isFile(pkgfile)) {
      let pkg = readPackage(pkgfile);
      if (pkg && packageFilter) pkg = packageFilter(pkg, dir);
      if (pkg && pkg.main) {
        if (typeof pkg.main !== "string") return undefined;
        const main = pkg.main === "." || pkg.main === "./" ? "index" : pkg.main;
        const m = loadAsFile(path.resolve(dir, main)) || loadAsDirectory(path.resolve(dir, main));
        if (m) return m;
      }
    }
    return loadAsFile(path.join(dir, "index"));
  }

  const absoluteStart = path.resolve(basedir);
  if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(x)) {
    let res = path.resolve(absoluteStart, x);
    if (x === "." || x === ".." || x.slice(-1) === "/") res += "/";
    return loadAsFile(res) || loadAsDirectory(res);
  }
  if (isBuiltin(x)) return x;
  for (const dir of nodeModulesDirs(absoluteStart)) {
    const candidate = path.join(dir, x);
    if (isDirectory(path.dirname(candidate))) {
      const m = loadAsFile(candidate) || loadAsDirectory(candidate);
      if (m) return m;
    }
  }
  return undefined;
}

// eslint-import-resolver-node's packageFilter: prefer "module", then "jsnext:main", over "main".
function makePackageFilter(extensions) {
  return (pkg, dir) => {
    for (const field of ["module", "jsnext:main"]) {
      if (pkg[field]) {
        const entry = String(pkg[field]).replace(/^(?:\.\/)?/, "./");
        if (resolveSync(entry, dir, extensions, null)) {
          return { ...pkg, main: pkg[field] };
        }
      }
    }
    return pkg;
  };
}

// The configured list is for JavaScript. A TypeScript file also resolves TypeScript sources, as
// eslint-import-resolver-typescript would; ESLint never linted TypeScript here.
function resolverExtensions(settings, sourceFile) {
  const resolver = settings && settings["import/resolver"];
  const node = resolver && resolver.node;
  const extensions = (node && node.extensions) || DEFAULT_EXTENSIONS;
  return /\.[cm]?tsx?$/.test(sourceFile) ? [...extensions, ".ts", ".tsx", ".d.ts"] : extensions;
}

const cache = new Map();

// eslint-module-utils/resolve: the absolute path a module specifier resolves to, null for a core
// module, undefined when it does not resolve.
function resolve(modulePath, context) {
  const settings = context.settings || {};
  const coreModules = settings["import/core-modules"] || [];
  if (coreModules.includes(modulePath)) return null;
  const sourceFile = context.physicalFilename || context.filename;
  const basedir = path.dirname(path.resolve(sourceFile));
  const extensions = resolverExtensions(settings, sourceFile);
  const key = `${basedir}\0${extensions.join(",")}\0${modulePath}`;
  if (cache.has(key)) return cache.get(key);
  let resolved;
  if (isBuiltin(modulePath)) {
    resolved = null;
  } else {
    resolved = resolveSync(modulePath, basedir, extensions, makePackageFilter(extensions));
  }
  cache.set(key, resolved);
  return resolved;
}

// eslint-module-utils/resolve.js fileExistsWithCaseSync, without the cache settings.
function fileExistsWithCaseSync(filepath, strict) {
  if (CASE_SENSITIVE_FS) return true;
  if (filepath === null) return true;
  if (filepath.toLowerCase() === process.cwd().toLowerCase() && !strict) return true;
  const parsedPath = path.parse(filepath);
  const dir = parsedPath.dir;
  if (dir === "" || parsedPath.root === filepath) return true;
  const filenames = fs.readdirSync(dir);
  if (!filenames.includes(parsedPath.base)) return false;
  return fileExistsWithCaseSync(dir, strict);
}

module.exports = { CASE_SENSITIVE_FS, fileExistsWithCaseSync, resolve };
