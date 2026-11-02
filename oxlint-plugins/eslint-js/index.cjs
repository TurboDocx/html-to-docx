"use strict";

// ESLint 7.32.0 core rules (MIT, see LICENSE) that Oxlint has no native version of, vendored so the
// checks the airbnb config enforced keep running without ESLint in the dependency tree. The rule
// files are ESLint's, ported to the API Oxlint exposes: context.sourceCode instead of
// context.getSourceCode(), sourceCode.getScope(node), and code path segments tracked by events.
module.exports = {
    meta: { name: "eslint-js" },
    rules: {
        camelcase: require("./rules/camelcase.cjs"),
        "consistent-return": require("./rules/consistent-return.cjs"),
        "dot-notation": require("./rules/dot-notation.cjs"),
        "lines-around-directive": require("./rules/lines-around-directive.cjs"),
        "lines-between-class-members": require("./rules/lines-between-class-members.cjs"),
        "no-buffer-constructor": require("./rules/no-buffer-constructor.cjs"),
        "no-dupe-args": require("./rules/no-dupe-args.cjs"),
        "no-octal": require("./rules/no-octal.cjs"),
        "no-octal-escape": require("./rules/no-octal-escape.cjs"),
        "no-restricted-syntax": require("./rules/no-restricted-syntax.cjs"),
        "no-return-await": require("./rules/no-return-await.cjs"),
        "spaced-comment": require("./rules/spaced-comment.cjs"),
        strict: require("./rules/strict.cjs")
    }
};
