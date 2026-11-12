"use strict";

// The subset of ESLint 7.32.0's lib/rules/utils/ast-utils.js (MIT, see LICENSE) that the vendored
// rules use, copied unchanged. Only canTokensBeAdjacent is simplified, see below.

const anyFunctionPattern = /^(?:Function(?:Declaration|Expression)|ArrowFunctionExpression)$/u;
const LINEBREAKS = new Set(["\r\n", "\r", "\n", " ", " "]);
const DECIMAL_INTEGER_PATTERN = /^(?:0|0[0-7]*[89]\d*|[1-9](?:_?\d)*)$/u;

function startsWithUpperCase(s) {
    return s[0] !== s[0].toLocaleLowerCase();
}

function isES5Constructor(node) {
    return (node.id && startsWithUpperCase(node.id.name));
}

function isFunction(node) {
    return Boolean(node && anyFunctionPattern.test(node.type));
}

function isNullLiteral(node) {
    return node.type === "Literal" && node.value === null && !node.regex && !node.bigint;
}

function getStaticStringValue(node) {
    switch (node.type) {
        case "Literal":
            if (node.value === null) {
                if (isNullLiteral(node)) {
                    return String(node.value);
                }
                if (node.regex) {
                    return `/${node.regex.pattern}/${node.regex.flags}`;
                }
                if (node.bigint) {
                    return node.bigint;
                }
            } else {
                return String(node.value);
            }
            break;
        case "TemplateLiteral":
            if (node.expressions.length === 0 && node.quasis.length === 1) {
                return node.quasis[0].value.cooked;
            }
            break;

        // no default
    }

    return null;
}

function getStaticPropertyName(node) {
    let prop;

    switch (node && node.type) {
        case "ChainExpression":
            return getStaticPropertyName(node.expression);

        case "Property":
        case "MethodDefinition":
            prop = node.key;
            break;

        case "MemberExpression":
            prop = node.property;
            break;

        // no default
    }

    if (prop) {
        if (prop.type === "Identifier" && !node.computed) {
            return prop.name;
        }

        return getStaticStringValue(prop);
    }

    return null;
}

function checkText(actual, expected) {
    return typeof expected === "string"
        ? actual === expected
        : expected.test(actual);
}

function isSpecificId(node, name) {
    return node.type === "Identifier" && checkText(node.name, name);
}

function isArrowToken(token) {
    return token.value === "=>" && token.type === "Punctuator";
}

function isSemicolonToken(token) {
    return token.value === ";" && token.type === "Punctuator";
}

function isOpeningBracketToken(token) {
    return token.value === "[" && token.type === "Punctuator";
}

function isTokenOnSameLine(left, right) {
    return left.loc.end.line === right.loc.start.line;
}

function getVariableByName(initScope, name) {
    let scope = initScope;

    while (scope) {
        const variable = scope.set.get(name);

        if (variable) {
            return variable;
        }

        scope = scope.upper;
    }

    return null;
}

function getDirectivePrologue(node) {
    const directives = [];

    // Directive prologues only occur at the top of files or functions.
    if (
        node.type === "Program" ||
        node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        (node.type === "ArrowFunctionExpression" && node.body.type === "BlockStatement")
    ) {
        const statements = node.type === "Program" ? node.body : node.body.body;

        for (const statement of statements) {
            if (
                statement.type === "ExpressionStatement" &&
                statement.expression.type === "Literal"
            ) {
                directives.push(statement);
            } else {
                break;
            }
        }
    }

    return directives;
}

function isDecimalInteger(node) {
    return node.type === "Literal" && typeof node.value === "number" &&
        DECIMAL_INTEGER_PATTERN.test(node.raw);
}

function getFunctionNameWithKind(node) {
    const parent = node.parent;
    const tokens = [];

    if (parent.type === "MethodDefinition" && parent.static) {
        tokens.push("static");
    }
    if (node.async) {
        tokens.push("async");
    }
    if (node.generator) {
        tokens.push("generator");
    }

    if (node.type === "ArrowFunctionExpression") {
        tokens.push("arrow", "function");
    } else if (parent.type === "Property" || parent.type === "MethodDefinition") {
        if (parent.kind === "constructor") {
            return "constructor";
        }
        if (parent.kind === "get") {
            tokens.push("getter");
        } else if (parent.kind === "set") {
            tokens.push("setter");
        } else {
            tokens.push("method");
        }
    } else {
        tokens.push("function");
    }

    if (node.id) {
        tokens.push(`'${node.id.name}'`);
    } else {
        const name = getStaticPropertyName(parent);

        if (name !== null) {
            tokens.push(`'${name}'`);
        }
    }

    return tokens.join(" ");
}

// ESLint tokenizes both sides with espree to decide this. dot-notation only asks it about an
// identifier followed by the next token, so the answer is "not when both touching characters are
// identifier characters", which is what espree concludes for that case.
function canTokensBeAdjacent(leftValue, rightToken) {
    const left = String(leftValue);
    const right = typeof rightToken === "string" ? rightToken : rightToken.value;
    return !(/[\p{ID_Continue}$]$/u.test(left) && /^[\p{ID_Continue}$]/u.test(right));
}

module.exports = {
    LINEBREAKS,
    canTokensBeAdjacent,
    getDirectivePrologue,
    getFunctionNameWithKind,
    getStaticPropertyName,
    getVariableByName,
    isArrowToken,
    isDecimalInteger,
    isES5Constructor,
    isFunction,
    isNullLiteral,
    isOpeningBracketToken,
    isSemicolonToken,
    isSpecificId,
    isTokenOnSameLine
};
