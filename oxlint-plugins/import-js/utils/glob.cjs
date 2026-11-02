"use strict";

// The part of minimatch (default options) that eslint-plugin-import's devDependencies globs use:
// brace expansion, `*`, `?` and `**`, with `*` and `**` not matching a leading dot, as minimatch's
// `dot: false` default. Written for this plugin so minimatch need not stay in the dependency tree.

function expandBraces(pattern) {
  const match = /\{([^{}]*)\}/.exec(pattern);
  if (!match) return [pattern];
  const before = pattern.slice(0, match.index);
  const after = pattern.slice(match.index + match[0].length);
  const options = match[1].split(",");
  if (options.length < 2) return [pattern];
  return options.flatMap((option) => expandBraces(before + option + after));
}

const escapeRegExp = (s) => s.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");

function segmentToRegExp(segment) {
  let out = "";
  for (const char of segment) {
    if (char === "*") out += "[^/]*";
    else if (char === "?") out += "[^/]";
    else out += escapeRegExp(char);
  }
  return /^[*?]/.test(segment) ? `(?!\\.)${out}` : out;
}

function globToRegExp(glob) {
  const segments = glob.split("/");
  let source = "";
  segments.forEach((segment, index) => {
    const last = index === segments.length - 1;
    if (segment === "**") {
      source += last ? "(?:(?!\\.)[^/]*(?:/|$))*" : "(?:(?!\\.)[^/]*/)*";
    } else {
      source += segmentToRegExp(segment) + (last ? "" : "/");
    }
  });
  return new RegExp(`^${source}$`);
}

const cache = new Map();

function minimatch(filename, pattern) {
  if (!cache.has(pattern)) {
    cache.set(pattern, expandBraces(pattern).map(globToRegExp));
  }
  const file = filename.split("\\").join("/");
  return cache.get(pattern).some((re) => re.test(file));
}

module.exports = { minimatch };
