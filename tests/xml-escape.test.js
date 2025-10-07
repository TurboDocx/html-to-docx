import { escapeXml } from '../src/utils/xml-escape.js';

describe('xml-escape utility', () => {
  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should escape ampersand character', () => {
    expect(escapeXml('Times & New Roman')).toBe('Times &amp; New Roman');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should escape less than character', () => {
    expect(escapeXml('Font<Name')).toBe('Font&lt;Name');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should escape greater than character', () => {
    expect(escapeXml('Font>Name')).toBe('Font&gt;Name');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should escape double quote character', () => {
    expect(escapeXml('Font"Name')).toBe('Font&quot;Name');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should escape single quote character', () => {
    expect(escapeXml("Font'Name")).toBe('Font&apos;Name');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should escape multiple special characters', () => {
    expect(escapeXml('<font name="Arial & Helvetica">'))
      .toBe('&lt;font name=&quot;Arial &amp; Helvetica&quot;&gt;');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should handle empty string', () => {
    expect(escapeXml('')).toBe('');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should handle string with no special characters', () => {
    expect(escapeXml('Arial')).toBe('Arial');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should prevent XML injection attack', () => {
    const maliciousInput = '"><script>alert("XSS")</script><w:rFonts w:ascii="';
    const escaped = escapeXml(maliciousInput);

    expect(escaped).toBe('&quot;&gt;&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&lt;w:rFonts w:ascii=&quot;');
    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('</script>');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should handle numeric values by converting to string', () => {
    expect(escapeXml(123)).toBe('123');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should handle consecutive special characters', () => {
    expect(escapeXml('&&&')).toBe('&amp;&amp;&amp;');
    expect(escapeXml('<<<')).toBe('&lt;&lt;&lt;');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should handle all special characters together', () => {
    expect(escapeXml('&<>"\''))
      .toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  // https://github.com/TurboDocx/html-to-docx/pull/129
  test('should preserve normal text between special characters', () => {
    expect(escapeXml('Normal & Text < With > Special "Characters"'))
      .toBe('Normal &amp; Text &lt; With &gt; Special &quot;Characters&quot;');
  });
});
