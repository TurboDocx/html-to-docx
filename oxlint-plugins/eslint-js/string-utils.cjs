"use strict";

// From ESLint 7.32.0's lib/shared/string-utils.js (MIT, see LICENSE).
function upperCaseFirst(string) {
    if (string.length <= 1) {
        return string.toUpperCase();
    }
    return string[0].toUpperCase() + string.slice(1);
}

module.exports = { upperCaseFirst };
