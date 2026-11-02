"use strict";

// eslint-plugin-import 2.31.0 rules (MIT, see LICENSE) that Oxlint's import plugin has no version
// of, vendored with the default node resolver so the airbnb config's checks keep running without
// ESLint in the dependency tree.
module.exports = {
  meta: { name: "import-js" },
  rules: {
    "no-duplicates": require("./rules/no-duplicates.cjs"),
    "no-extraneous-dependencies": require("./rules/no-extraneous-dependencies.cjs"),
    "no-unresolved": require("./rules/no-unresolved.cjs"),
    "no-useless-path-segments": require("./rules/no-useless-path-segments.cjs"),
    order: require("./rules/order.cjs"),
  },
};
