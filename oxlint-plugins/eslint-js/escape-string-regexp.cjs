"use strict";

// escape-string-regexp@4.0.0 (MIT, Sindre Sorhus), the version ESLint 7 depends on.
module.exports = string => {
    if (typeof string !== "string") {
        throw new TypeError("Expected a string");
    }

    // Escape characters with special meaning either inside or outside character sets.
    // Use a simple backslash escape when it's always valid, and a \unnnn escape when the simpler form would be disallowed by Unicode patterns' stricter grammar.
    return string
        .replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
        .replace(/-/g, "\\x2d");
};
