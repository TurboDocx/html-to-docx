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

---

## Testing Framework (`helpers/`)

The `helpers/` directory contains a high-performance testing framework for validating DOCX output.

### Architecture Overview

The framework uses a **parse-once, lazy-load** architecture:

1. **Parse once per test** - DOCX is unzipped and parsed once, then reused across assertions
2. **Lazy parsing** - Paragraph properties only parsed when accessed (~50% faster for text-only tests)
3. **Compiled regexes** - Patterns compiled once at module load (~5-10% improvement)
4. **Shared validation** - Common validation logic extracted to helpers

### Files

```
helpers/
├── constants.js         # Compiled regex patterns with documentation
├── docx-validator.js    # Core parsing utilities (unzip, extract, parse)
└── docx-assertions.js   # High-level assertion helpers
```

### Basic Usage

```javascript
import { parseDOCX, assertParagraphCount, assertParagraphText } from './helpers/docx-assertions.js';

test('should create document with correct content', async () => {
  const docx = await HTMLtoDOCX('<p>Hello</p><p>World</p>');

  // Parse DOCX once
  const parsed = await parseDOCX(docx);

  // Run multiple assertions on parsed result (no re-parsing)
  assertParagraphCount(parsed, 2);
  assertParagraphText(parsed, 0, 'Hello');
  assertParagraphText(parsed, 1, 'World');
});
```

### Performance Characteristics

**Lazy Parsing:**
- Properties parsed on-demand (only when accessed)
- Cached after first access
- ~50% faster for tests that only check text content
- Same speed for tests that check all properties

**Example:**
```javascript
const parsed = await parseDOCX(docx);

// Only text is parsed (fast)
console.log(parsed.paragraphs[0].text);

// Properties parsed on first access, then cached
console.log(parsed.paragraphs[0].properties.alignment);

// Cached value returned (no re-parsing)
console.log(parsed.paragraphs[0].properties.alignment);
```

### Available Assertions

#### Paragraph Assertions
- `assertParagraphCount(parsed, count)` - Verify number of paragraphs
- `assertParagraphText(parsed, index, expectedText)` - Verify paragraph text
- `assertParagraphAlignment(parsed, index, alignment)` - Verify alignment (left, center, right, both)
- `assertParagraphProperty(parsed, index, propertyName, value)` - Generic property assertion
- `assertAllParagraphsHaveProperty(parsed, propertyName, value)` - Assert all paragraphs have property

#### Run (Text Formatting) Assertions
- `assertRunColor(parsed, paraIndex, hexColor)` - Verify text color
- `assertRunFont(parsed, paraIndex, fontName)` - Verify font family

#### Advanced Usage
```javascript
// Direct access to parsed structure
const parsed = await parseDOCX(docx);

// Access paragraph properties
const para = parsed.paragraphs[0];
console.log(para.text);                    // Text content
console.log(para.properties.alignment);    // Alignment
console.log(para.properties.spacingBefore); // Spacing before (TWIPs)
console.log(para.properties.spacingAfter);  // Spacing after (TWIPs)

// Access run (formatting) properties
const run = para.runs[0];
console.log(run.text);      // Text content
console.log(run.font);      // Font family
console.log(run.color);     // Color (hex)
console.log(run.fontSize);  // Font size (half-points: 24 = 12pt)
console.log(run.bold);      // Bold flag
console.log(run.italic);    // Italic flag
```

### What's Supported

✅ **Supported:**
- Paragraph text extraction
- Paragraph properties (alignment, spacing)
- Text run properties (font, color, size, bold, italic)
- Multiple paragraphs
- Complex nested HTML structures

❌ **Not Currently Supported:**
- Headers/footers (word/header1.xml)
- Styles.xml parsing
- Table validation
- Image data validation
- Hyperlinks
- Comments/track changes

### Implementation Details

**Regex vs XML Parser:**
- Uses regex for performance (10x faster than xmlbuilder2)
- Trade-off: Less robust for malformed XML
- Acceptable: Test DOCX files are always well-formed

**Lazy Parsing Implementation:**
```javascript
class LazyParagraph {
  get text() {
    if (this._text === null) {
      this._text = extractText(this.xml);  // Parse on first access
    }
    return this._text;  // Return cached value
  }
}
```

**Regex Constants:**
- Defined in `constants.js` to avoid recompilation
- Performance: 10 paragraphs = 1 regex compilation instead of 10

### Limitations

1. **Regex-based parsing** - May fail on complex/malformed XML
2. **document.xml only** - Doesn't parse other DOCX parts
3. **No style validation** - Doesn't check styles.xml consistency

### Future Enhancements

**Not implemented (document for future):**
- Test-level caching for identical HTML inputs
- More assertion helpers (tables, images, hyperlinks)
- Debugging utilities (`dumpParagraph()`, `dumpStructure()`)
- Header/footer parsing
- TypeScript definitions for better intellisense

### Examples

See `vtree-iteration.test.js` for comprehensive usage examples.
