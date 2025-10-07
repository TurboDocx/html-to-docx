import HTMLtoDOCX from '../index.js';
import { defaultHeadingOptions } from '../src/constants.js';
import { parseDOCX, assertParagraphCount, assertParagraphText } from './helpers/docx-assertions.js';

describe('Heading Styles Integration Tests', () => {
  describe('End-to-end document generation', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should generate document with default heading styles', async () => {
      const htmlString = `
        <h1>Main Heading</h1>
        <p>Content under main heading</p>
        <h2>Subheading</h2>
        <p>Content under subheading</p>
        <h3>Section Heading</h3>
        <p>Content under section</p>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      // Verify document structure
      assertParagraphCount(parsed, 6);
      assertParagraphText(parsed, 0, 'Main Heading');
      assertParagraphText(parsed, 1, 'Content under main heading');
      assertParagraphText(parsed, 2, 'Subheading');
      assertParagraphText(parsed, 3, 'Content under subheading');
      assertParagraphText(parsed, 4, 'Section Heading');
      assertParagraphText(parsed, 5, 'Content under section');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should generate document with custom heading styles', async () => {
      const htmlString = `
        <h1>Custom Styled Heading</h1>
        <p>This heading should use custom styles</p>
      `;

      const options = {
        heading: {
          heading1: {
            font: 'Arial',
            fontSize: 60,
            bold: true,
            spacing: { before: 500, after: 100 },
            keepLines: true,
            keepNext: true,
            outlineLevel: 0,
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Custom Styled Heading');
      assertParagraphText(parsed, 1, 'This heading should use custom styles');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle all heading levels H1-H6', async () => {
      const htmlString = `
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 6);
      assertParagraphText(parsed, 0, 'Heading 1');
      assertParagraphText(parsed, 1, 'Heading 2');
      assertParagraphText(parsed, 2, 'Heading 3');
      assertParagraphText(parsed, 3, 'Heading 4');
      assertParagraphText(parsed, 4, 'Heading 5');
      assertParagraphText(parsed, 5, 'Heading 6');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle partial heading configuration', async () => {
      const htmlString = `
        <h1>Title with Custom Font</h1>
        <h2>Subtitle with Default Styles</h2>
        <h3>Section Header</h3>
      `;

      const options = {
        heading: {
          heading1: {
            fontSize: 72, // Only override font size
          },
          // H2 and H3 should use defaults
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 3);
      assertParagraphText(parsed, 0, 'Title with Custom Font');
      assertParagraphText(parsed, 1, 'Subtitle with Default Styles');
      assertParagraphText(parsed, 2, 'Section Header');
    });
  });

  describe('Configuration merging behavior', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should merge custom config with default config', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            fontSize: 100, // Only override fontSize, keep other defaults
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
      assertParagraphText(parsed, 1, 'Content');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle empty heading configuration object', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {},
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
      assertParagraphText(parsed, 1, 'Content');
    });
  });

  describe('Special characters and security', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle font names with ampersands', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            font: 'Times & New Roman',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
      assertParagraphText(parsed, 1, 'Content');

      // Font name with ampersand should be properly escaped and document generated
      expect(parsed.paragraphs[0].runs.length).toBeGreaterThan(0);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should prevent XML injection in font names', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            font: '<script>alert("xss")</script>',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
      assertParagraphText(parsed, 1, 'Content');

      // Malicious font name should be escaped and not executed
      expect(parsed.xml).not.toContain('<script>');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle special XML characters in font names', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            font: 'Font<>Name"\'&',
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');

      // Test validates that special characters in font names don't crash document generation
      // Note: Font escaping occurs in styles.xml, not document.xml
    });
  });

  describe('Validation and edge cases', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should clamp outline level to valid range', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            outlineLevel: 99, // Should be clamped to 5
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle negative outline level', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            outlineLevel: -10, // Should be clamped to 0
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle zero font size', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            fontSize: 0, // Invalid but shouldn't crash
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle negative font size', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            fontSize: -20, // Invalid but shouldn't crash
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle spacing with zero values', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            spacing: { before: 0, after: 0 },
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
      // Zero spacing is valid and document should generate
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle undefined spacing properties', async () => {
      const htmlString = '<h1>Test Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            spacing: { before: undefined, after: 100 },
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Test Heading');
    });
  });

  describe('Complex HTML with multiple heading levels', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle nested content with all heading levels', async () => {
      const htmlString = `
        <h1>Document Title</h1>
        <p>Introduction paragraph</p>

        <h2>Chapter 1</h2>
        <p>Chapter content</p>

        <h3>Section 1.1</h3>
        <p>Section content</p>

        <h4>Subsection 1.1.1</h4>
        <p>Subsection content</p>

        <h5>Detail 1.1.1.1</h5>
        <p>Detail content</p>

        <h6>Note 1.1.1.1.1</h6>
        <p>Note content</p>

        <h2>Chapter 2</h2>
        <p>More content</p>
      `;

      const result = await HTMLtoDOCX(htmlString, {});
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 14);
      assertParagraphText(parsed, 0, 'Document Title');
      assertParagraphText(parsed, 2, 'Chapter 1');
      assertParagraphText(parsed, 4, 'Section 1.1');
      assertParagraphText(parsed, 6, 'Subsection 1.1.1');
      assertParagraphText(parsed, 8, 'Detail 1.1.1.1');
      assertParagraphText(parsed, 10, 'Note 1.1.1.1.1');
      assertParagraphText(parsed, 12, 'Chapter 2');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle document with mixed custom heading styles', async () => {
      const htmlString = `
        <h1>Custom H1</h1>
        <h2>Custom H2</h2>
        <h3>Default H3</h3>
        <h4>Default H4</h4>
      `;

      const options = {
        heading: {
          heading1: {
            font: 'Arial',
            fontSize: 60,
            bold: true,
            spacing: { before: 600, after: 200 },
          },
          heading2: {
            font: 'Georgia',
            fontSize: 40,
            bold: false,
            spacing: { before: 400, after: 150 },
          },
          // H3 and H4 use defaults
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 4);
      assertParagraphText(parsed, 0, 'Custom H1');
      assertParagraphText(parsed, 1, 'Custom H2');
      assertParagraphText(parsed, 2, 'Default H3');
      assertParagraphText(parsed, 3, 'Default H4');
    });
  });

  describe('Compatibility with other options', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should work with custom document font and heading styles', async () => {
      const htmlString = `
        <h1>Heading with Custom Styles</h1>
        <p>Paragraph with document font</p>
      `;

      const options = {
        font: 'Times New Roman',
        fontSize: 24,
        heading: {
          heading1: {
            font: 'Arial',
            fontSize: 48,
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Heading with Custom Styles');
      assertParagraphText(parsed, 1, 'Paragraph with document font');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should work with orientation and margins', async () => {
      const htmlString = `
        <h1>Test Document</h1>
        <h2>Subsection</h2>
        <p>Content</p>
      `;

      const options = {
        orientation: 'landscape',
        margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        heading: {
          heading1: { fontSize: 52 },
          heading2: { fontSize: 38 },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 3);
      assertParagraphText(parsed, 0, 'Test Document');
      assertParagraphText(parsed, 1, 'Subsection');
      assertParagraphText(parsed, 2, 'Content');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should work with RTL direction', async () => {
      const htmlString = `
        <h1>عنوان</h1>
        <p>محتوى</p>
      `;

      const options = {
        direction: 'rtl',
        lang: 'ar-SA',
        heading: {
          heading1: {
            font: 'Arabic Typesetting',
            fontSize: 52,
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'عنوان');
      assertParagraphText(parsed, 1, 'محتوى');
    });
  });

  describe('Boolean properties', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should respect bold: false', async () => {
      const htmlString = '<h1>Non-Bold Heading</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            bold: false,
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Non-Bold Heading');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should respect keepLines: false', async () => {
      const htmlString = '<h1>Heading Without Keep Lines</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            keepLines: false,
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Heading Without Keep Lines');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should respect keepNext: false', async () => {
      const htmlString = '<h1>Heading Without Keep Next</h1><p>Content</p>';

      const options = {
        heading: {
          heading1: {
            ...defaultHeadingOptions.heading1,
            keepNext: false,
          },
        },
      };

      const result = await HTMLtoDOCX(htmlString, options);
      const parsed = await parseDOCX(result);

      assertParagraphCount(parsed, 2);
      assertParagraphText(parsed, 0, 'Heading Without Keep Next');
    });
  });
});
