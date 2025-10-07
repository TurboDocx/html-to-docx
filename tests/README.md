# Unit Tests for html-to-docx

This directory contains unit and integration tests for the html-to-docx library.

## Related Pull Request

All tests in this directory are related to [PR #129 - Customizable Heading Styles](https://github.com/TurboDocx/html-to-docx/pull/129)

## Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage report
npm run test:unit:coverage

# Run a specific test file
npx jest tests/xml-escape.test.js
npx jest tests/heading-styles.test.js
npx jest tests/heading-integration.test.js

# Run all tests (unit + integration)
npm run test:all
```

## Test Coverage

The test suite covers:
- ✅ XML escaping and injection prevention
- ✅ Default heading styles generation
- ✅ Custom heading configuration
- ✅ Deep merge of configuration with defaults
- ✅ Input validation and edge cases
- ✅ Font size and outline level clamping
- ✅ Spacing configuration (before/after)
- ✅ Boolean properties (bold, keepLines, keepNext)
- ✅ XML structure validity
- ✅ Security (XSS prevention, special character escaping)
- ✅ End-to-end document generation
- ✅ Compatibility with other document options

## Critical Issues Tested

Based on feedback from [PR #116](https://github.com/TurboDocx/html-to-docx/pull/116), these tests specifically validate:

1. **Code Duplication Fix** - Tests verify that defaults are imported from constants
2. **XML Injection Prevention** - Tests ensure font names are properly escaped
3. **Font Size Validation** - Tests check that zero and negative values are handled
4. **Spacing Null Safety** - Tests validate undefined spacing properties don't crash
5. **Deep Merge** - Tests confirm partial configurations merge with defaults correctly
6. **Outline Level Validation** - Tests verify clamping to 0-5 range

## Test Philosophy

- Each test case is linked to PR #129 via comments
- Tests follow AAA pattern (Arrange, Act, Assert)
- Edge cases and error conditions are explicitly tested
- Security vulnerabilities are tested and prevented
- Integration tests verify real-world usage scenarios
