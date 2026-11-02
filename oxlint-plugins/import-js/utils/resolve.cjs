"use strict";

// What eslint-plugin-import's default "node" resolver did: eslint-module-utils/resolve.js 2.12.0
// driving eslint-import-resolver-node 0.3.9, which drives resolve@1 (resolve/lib/sync.js). All MIT, see
// LICENSE and LICENSE-resolve.
// Ported without the resolver plugin loading, since "node" is the only resolver these configs use.
// Like resolve@1, this ignores package.json "exports" and prefers "module" over "main".
//
// Two changes make the answer the same on every machine, where the original depended on what was
// installed or built around the project:
// - node_modules folders above the directory Oxlint runs in are not searched, so a package that
//   only resolves from a parent folder of the checkout is unresolved, as it is in CI.
// - A TypeScript file resolves the package's own name to the package itself (Node's self-reference)
//   and prefers its "types" entry, as TypeScript does, instead of the build output in "main".

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

const isInside = (dir, root) => !path.relative(root, dir).startsWith("..");

function ancestors(absoluteStart, root) {
  const paths = [absoluteStart];
  let parsed = path.parse(absoluteStart);
  while (parsed.dir !== paths[paths.length - 1]) {
    paths.push(parsed.dir);
    parsed = path.parse(parsed.dir);
  }
  return root ? paths.filter((dir) => isInside(dir, root)) : paths;
}

function nodeModulesDirs(absoluteStart, root) {
  return ancestors(absoluteStart, root).map((aPath) => path.resolve("/", aPath, "node_modules"));
}

// The nearest package.json at or above `start`, inside `root`.
function nearestPackage(start, root) {
  for (const dir of ancestors(start, root)) {
    const pkgfile = path.join(dir, "package.json");
    if (isFile(pkgfile)) return { dir, pkg: readPackage(pkgfile) };
  }
  return undefined;
}

// resolve@1's resolveSync(x, { basedir, extensions, packageFilter }), returning undefined when
// resolve would throw MODULE_NOT_FOUND.
function resolveSync(x, basedir, extensions, packageFilter, { root, selfReference } = {}) {
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
  if (selfReference) {
    const own = nearestPackage(absoluteStart, root);
    const name = own && own.pkg && own.pkg.name;
    if (name && own.pkg.exports !== undefined && (x === name || x.startsWith(`${name}/`))) {
      const target = path.join(own.dir, x.slice(name.length));
      const m = loadAsFile(target) || loadAsDirectory(target);
      if (m) return m;
    }
  }
  for (const dir of nodeModulesDirs(absoluteStart, root)) {
    const candidate = path.join(dir, x);
    if (isDirectory(path.dirname(candidate))) {
      const m = loadAsFile(candidate) || loadAsDirectory(candidate);
      if (m) return m;
    }
  }
  return undefined;
}

// eslint-import-resolver-node's packageFilter: prefer "module", then "jsnext:main", over "main".
// TypeScript files try "types" and "typings" first.
function makePackageFilter(extensions, typescript) {
  const fields = typescript ? ["types", "typings", "module", "jsnext:main"] : ["module", "jsnext:main"];
  return (pkg, dir) => {
    for (const field of fields) {
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

const isTypeScript = (file) => /\.[cm]?tsx?$/.test(file);

// The configured list is for JavaScript. A TypeScript file also resolves TypeScript sources, as
// eslint-import-resolver-typescript would; ESLint never linted TypeScript here.
function resolverExtensions(settings, sourceFile) {
  const resolver = settings && settings["import/resolver"];
  const node = resolver && resolver.node;
  const extensions = (node && node.extensions) || DEFAULT_EXTENSIONS;
  return isTypeScript(sourceFile) ? [...extensions, ".ts", ".tsx", ".d.ts"] : extensions;
}

// eslint-module-utils' ModuleCache: entries expire after its default lifetime of 30 seconds, so a
// long-lived process (an editor's language server) notices files created or deleted since.
const CACHE_LIFETIME_MS = 30_000;
function createCache() {
  const entries = new Map();
  return {
    get(key) {
      const entry = entries.get(key);
      if (entry === undefined || Date.now() - entry.at > CACHE_LIFETIME_MS) return undefined;
      return entry.value;
    },
    set(key, value) {
      entries.set(key, { value, at: Date.now() });
    },
  };
}

// Resolved paths; a miss is not cached, as upstream does not (its `cache(undefined)` is commented out).
const resolveCache = createCache();
// fileExistsWithCaseSync results per path, as upstream's fileExistsCache.
const fileExistsCache = createCache();

// eslint-module-utils/resolve: the absolute path a module specifier resolves to, null for a core
// module, undefined when it does not resolve.
function resolve(modulePath, context) {
  const settings = context.settings || {};
  const coreModules = settings["import/core-modules"] || [];
  if (coreModules.includes(modulePath)) return null;
  const sourceFile = context.physicalFilename || context.filename;
  const basedir = path.dirname(path.resolve(sourceFile));
  const extensions = resolverExtensions(settings, sourceFile);
  const root = path.resolve(context.cwd || process.cwd());
  const typescript = isTypeScript(sourceFile);
  const key = `${root}\0${basedir}\0${extensions.join(",")}\0${modulePath}`;
  const cached = resolveCache.get(key);
  if (cached !== undefined) return cached;
  let resolved;
  if (isBuiltin(modulePath)) {
    resolved = null;
  } else {
    resolved = resolveSync(modulePath, basedir, extensions, makePackageFilter(extensions, typescript), {
      root,
      selfReference: typescript,
    });
  }
  if (resolved !== undefined) resolveCache.set(key, resolved);
  return resolved;
}

// eslint-module-utils/resolve.js fileExistsWithCaseSync, with its per-path cache (default lifetime).
function fileExistsWithCaseSync(filepath, strict) {
  if (CASE_SENSITIVE_FS) return true;
  if (filepath === null) return true;
  if (filepath.toLowerCase() === process.cwd().toLowerCase() && !strict) return true;
  const parsedPath = path.parse(filepath);
  const dir = parsedPath.dir;
  const cached = fileExistsCache.get(filepath);
  if (cached !== undefined) return cached;
  let result;
  if (dir === "" || parsedPath.root === filepath) {
    result = true;
  } else {
    const filenames = fs.readdirSync(dir);
    result = filenames.includes(parsedPath.base) ? fileExistsWithCaseSync(dir, strict) : false;
  }
  fileExistsCache.set(filepath, result);
  return result;
}

module.exports = { CASE_SENSITIVE_FS, fileExistsWithCaseSync, resolve };
