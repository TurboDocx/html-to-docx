import generateStylesXML from '../src/schemas/styles.js';
import { defaultHeadingOptions } from '../src/constants.js';

describe('Heading Styles Generation', () => {
  describe('Default heading styles', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should generate styles XML with default heading options', () => {
      const stylesXML = generateStylesXML();

      expect(stylesXML).toContain('<w:style w:type="paragraph" w:styleId="Heading1">');
      expect(stylesXML).toContain('<w:style w:type="paragraph" w:styleId="Heading2">');
      expect(stylesXML).toContain('<w:style w:type="paragraph" w:styleId="Heading3">');
      expect(stylesXML).toContain('<w:style w:type="paragraph" w:styleId="Heading4">');
      expect(stylesXML).toContain('<w:style w:type="paragraph" w:styleId="Heading5">');
      expect(stylesXML).toContain('<w:style w:type="paragraph" w:styleId="Heading6">');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should include correct default font sizes', () => {
      const stylesXML = generateStylesXML();

      expect(stylesXML).toContain('<w:sz w:val="48" />'); // H1: 24pt
      expect(stylesXML).toContain('<w:sz w:val="36" />'); // H2: 18pt
      expect(stylesXML).toContain('<w:sz w:val="28" />'); // H3: 14pt
      expect(stylesXML).toContain('<w:sz w:val="24" />'); // H4: 12pt
      expect(stylesXML).toContain('<w:sz w:val="20" />'); // H6: 10pt
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should include bold formatting for all headings', () => {
      const stylesXML = generateStylesXML();

      // Count bold tags - should have at least 6 (one per heading)
      const boldCount = (stylesXML.match(/<w:b \/>/g) || []).length;
      expect(boldCount).toBeGreaterThanOrEqual(6);
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should include correct outline levels', () => {
      const stylesXML = generateStylesXML();

      expect(stylesXML).toContain('<w:outlineLvl w:val="0" />');
      expect(stylesXML).toContain('<w:outlineLvl w:val="1" />');
      expect(stylesXML).toContain('<w:outlineLvl w:val="2" />');
      expect(stylesXML).toContain('<w:outlineLvl w:val="3" />');
      expect(stylesXML).toContain('<w:outlineLvl w:val="4" />');
      expect(stylesXML).toContain('<w:outlineLvl w:val="5" />');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should include keepLines and keepNext properties', () => {
      const stylesXML = generateStylesXML();

      // Should have keepLines and keepNext for all 6 headings
      const keepLinesCount = (stylesXML.match(/<w:keepLines \/>/g) || []).length;
      const keepNextCount = (stylesXML.match(/<w:keepNext \/>/g) || []).length;

      expect(keepLinesCount).toBe(6);
      expect(keepNextCount).toBe(6);
    });
  });

  describe('Custom heading configuration', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should override font size for custom heading', () => {
      const customConfig = {
        heading1: {
          ...defaultHeadingOptions.heading1,
          fontSize: 72, // 36pt
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      expect(stylesXML).toContain('<w:sz w:val="72" />');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should override font family for custom heading', () => {
      const customConfig = {
        heading1: {
          ...defaultHeadingOptions.heading1,
          font: 'Arial',
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      expect(stylesXML).toContain('w:ascii="Arial"');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle custom spacing before and after', () => {
      const customConfig = {
        heading2: {
          ...defaultHeadingOptions.heading2,
          spacing: {
            before: 600,
            after: 200,
          },
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      expect(stylesXML).toContain('w:before="600"');
      expect(stylesXML).toContain('w:after="200"');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should disable bold when explicitly set to false', () => {
      const customConfig = {
        heading3: {
          ...defaultHeadingOptions.heading3,
          bold: false,
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      // Heading 3 section should not contain bold tag
      const heading3Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading3">[\s\S]*?<\/w:style>/
      )[0];

      expect(heading3Section).not.toContain('<w:b />');
    });
  });

  describe('Edge cases and validation', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should validate outline level within 0-5 range', () => {
      const customConfig = {
        heading1: {
          ...defaultHeadingOptions.heading1,
          outlineLevel: 10, // Invalid - should be clamped to 5
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      // Should be clamped to max value of 5
      const heading1Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading1">[\s\S]*?<\/w:style>/
      )[0];

      expect(heading1Section).toContain('<w:outlineLvl w:val="5" />');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle negative outline level', () => {
      const customConfig = {
        heading2: {
          ...defaultHeadingOptions.heading2,
          outlineLevel: -5, // Invalid - should be clamped to 0
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading2Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading2">[\s\S]*?<\/w:style>/
      )[0];

      expect(heading2Section).toContain('<w:outlineLvl w:val="0" />');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should not render font size when undefined', () => {
      const customConfig = {
        heading4: {
          ...defaultHeadingOptions.heading4,
          fontSize: undefined,
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading4Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading4">[\s\S]*?<\/w:style>/
      )[0];

      // Should not contain w:sz tag for heading 4
      expect(heading4Section).not.toContain('<w:sz');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle zero font size (invalid)', () => {
      const customConfig = {
        heading5: {
          ...defaultHeadingOptions.heading5,
          fontSize: 0, // Invalid - should not be rendered
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading5Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading5">[\s\S]*?<\/w:style>/
      )[0];

      // Should not contain font size tag since 0 is invalid
      expect(heading5Section).not.toContain('<w:sz');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle negative font size (invalid)', () => {
      const customConfig = {
        heading6: {
          ...defaultHeadingOptions.heading6,
          fontSize: -10, // Invalid - should not be rendered
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading6Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading6">[\s\S]*?<\/w:style>/
      )[0];

      // Should not contain font size tag since negative is invalid
      expect(heading6Section).not.toContain('<w:sz');
    });
  });

  describe('Spacing configuration edge cases', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle spacing with only before value', () => {
      const customConfig = {
        heading1: {
          ...defaultHeadingOptions.heading1,
          spacing: {
            before: 300,
          },
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      expect(stylesXML).toContain('w:before="300"');
      // Should not have w:after since it's undefined
      const heading1Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading1">[\s\S]*?<\/w:style>/
      )[0];
      const spacingMatch = heading1Section.match(/<w:spacing[^>]*>/);
      expect(spacingMatch[0]).not.toContain('w:after=');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle spacing with only after value', () => {
      const customConfig = {
        heading2: {
          ...defaultHeadingOptions.heading2,
          spacing: {
            after: 150,
          },
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      expect(stylesXML).toContain('w:after="150"');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle spacing with before=0 (valid value)', () => {
      const customConfig = {
        heading3: {
          ...defaultHeadingOptions.heading3,
          spacing: {
            before: 0,
            after: 100,
          },
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      // Zero is a valid spacing value and should be rendered
      expect(stylesXML).toContain('w:before="0"');
      expect(stylesXML).toContain('w:after="100"');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should merge with default spacing when spacing object is undefined', () => {
      const customConfig = {
        heading4: {
          font: 'Arial',
          fontSize: 24,
          bold: true,
          // spacing is undefined - should use default from defaultHeadingOptions
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading4Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading4">[\s\S]*?<\/w:style>/
      )[0];

      // Should contain default spacing since config merges with defaults
      expect(heading4Section).toContain('<w:spacing');
      expect(heading4Section).toContain('w:before="240"');
      expect(heading4Section).toContain('w:after="40"');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should handle empty spacing object', () => {
      const customConfig = {
        heading5: {
          ...defaultHeadingOptions.heading5,
          spacing: {},
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading5Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading5">[\s\S]*?<\/w:style>/
      )[0];

      // Should not render spacing tag when both before and after are undefined
      expect(heading5Section).not.toContain('<w:spacing');
    });
  });

  describe('Deep merge configuration', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should merge partial configuration with defaults', () => {
      const customConfig = {
        heading1: {
          fontSize: 60, // Only override fontSize
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading1Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading1">[\s\S]*?<\/w:style>/
      )[0];

      // Should have custom fontSize
      expect(heading1Section).toContain('<w:sz w:val="60" />');
      // Should retain default bold
      expect(heading1Section).toContain('<w:b />');
      // Should retain default keepLines
      expect(heading1Section).toContain('<w:keepLines />');
      // Should retain default keepNext
      expect(heading1Section).toContain('<w:keepNext />');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should preserve unmodified headings with defaults', () => {
      const customConfig = {
        heading1: {
          fontSize: 60,
        },
        // heading2 not specified - should use defaults
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading2Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading2">[\s\S]*?<\/w:style>/
      )[0];

      // Should have default H2 fontSize (36 = 18pt)
      expect(heading2Section).toContain('<w:sz w:val="36" />');
      // Should have default spacing
      expect(heading2Section).toContain('w:before="360"');
      expect(heading2Section).toContain('w:after="80"');
    });
  });

  describe('XML structure and validity', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should generate valid XML structure', () => {
      const stylesXML = generateStylesXML();

      // Should have proper XML declaration
      expect(stylesXML).toContain('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
      // Should have w:styles root element
      expect(stylesXML).toContain('<w:styles');
      expect(stylesXML).toContain('</w:styles>');
      // Should have proper namespace declarations
      expect(stylesXML).toContain('xmlns:w=');
      expect(stylesXML).toContain('xmlns:r=');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should include proper style hierarchy elements', () => {
      const stylesXML = generateStylesXML();

      // Each heading should have proper structure
      expect(stylesXML).toContain('<w:basedOn w:val="Normal" />');
      expect(stylesXML).toContain('<w:next w:val="Normal" />');
      expect(stylesXML).toContain('<w:uiPriority w:val="9" />');
      expect(stylesXML).toContain('<w:qFormat />');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should include semiHidden for H3-H6', () => {
      const stylesXML = generateStylesXML();

      const heading3Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading3">[\s\S]*?<\/w:style>/
      )[0];
      expect(heading3Section).toContain('<w:semiHidden />');

      const heading1Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading1">[\s\S]*?<\/w:style>/
      )[0];
      expect(heading1Section).not.toContain('<w:semiHidden />');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should include unhideWhenUsed for H2-H6', () => {
      const stylesXML = generateStylesXML();

      const heading2Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading2">[\s\S]*?<\/w:style>/
      )[0];
      expect(heading2Section).toContain('<w:unhideWhenUsed />');

      const heading1Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading1">[\s\S]*?<\/w:style>/
      )[0];
      expect(heading1Section).not.toContain('<w:unhideWhenUsed />');
    });
  });

  describe('Font handling and XML escaping', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should escape special characters in font names', () => {
      const customConfig = {
        heading1: {
          ...defaultHeadingOptions.heading1,
          font: 'Times & New Roman',
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      // Ampersand should be escaped
      expect(stylesXML).toContain('Times &amp; New Roman');
      expect(stylesXML).not.toContain('w:ascii="Times & New Roman"');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should prevent XML injection in font names', () => {
      const customConfig = {
        heading2: {
          ...defaultHeadingOptions.heading2,
          font: '"><malicious>',
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      // Should be properly escaped
      expect(stylesXML).toContain('&quot;&gt;&lt;malicious&gt;');
      expect(stylesXML).not.toContain('"><malicious>');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should render font tag even when font matches default document font', () => {
      const defaultFont = 'Calibri';
      const customConfig = {
        heading3: {
          ...defaultHeadingOptions.heading3,
          font: defaultFont,
        },
      };

      const stylesXML = generateStylesXML(defaultFont, 22, 22, 'en-US', customConfig);

      const heading3Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading3">[\s\S]*?<\/w:style>/
      )[0];

      // Current implementation renders font tag when heading font is set
      // (even if it matches the default document font)
      expect(heading3Section).toContain('<w:rFonts');
      expect(heading3Section).toContain('w:ascii="Calibri"');
    });
  });

  describe('Keep properties', () => {
    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should disable keepLines when set to false', () => {
      const customConfig = {
        heading4: {
          ...defaultHeadingOptions.heading4,
          keepLines: false,
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading4Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading4">[\s\S]*?<\/w:style>/
      )[0];

      expect(heading4Section).not.toContain('<w:keepLines />');
    });

    // https://github.com/TurboDocx/html-to-docx/pull/129
    test('should disable keepNext when set to false', () => {
      const customConfig = {
        heading5: {
          ...defaultHeadingOptions.heading5,
          keepNext: false,
        },
      };

      const stylesXML = generateStylesXML('Calibri', 22, 22, 'en-US', customConfig);

      const heading5Section = stylesXML.match(
        /<w:style w:type="paragraph" w:styleId="Heading5">[\s\S]*?<\/w:style>/
      )[0];

      expect(heading5Section).not.toContain('<w:keepNext />');
    });
  });
});
