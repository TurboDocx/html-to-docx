/**
 * Test Helper Constants
 *
 * Regex patterns for parsing DOCX XML content in tests.
 *
 */

// =============================================================================
// PARAGRAPH-LEVEL PATTERNS
// =============================================================================

/**
 * Matches complete paragraph elements including all nested content.
 *
 * What it matches: <w:p>...</w:p> or <w:p w:attr="value">...</w:p>
 * Used by: findParagraphs()
 *
 * Example match:
 * <w:p>
 *   <w:pPr><w:jc w:val="center"/></w:pPr>
 *   <w:r><w:t>Hello World</w:t></w:r>
 * </w:p>
 */
export const PARAGRAPH_REGEX = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;

/**
 * Matches paragraph alignment/justification property.
 *
 * What it matches: <w:jc w:val="center"/>
 * Captures: The alignment value (left, center, right, both)
 * Used by: extractParagraphProperties()
 *
 * Example: <w:jc w:val="center"/> → captures "center"
 */
export const ALIGNMENT_REGEX = /<w:jc w:val="([^"]+)"/;

/**
 * Matches paragraph spacing before property.
 *
 * What it matches: <w:spacing w:before="240"/>
 * Captures: The spacing value in TWIPs (1/1440 inch)
 * Used by: extractParagraphProperties()
 *
 * Example: <w:spacing w:before="240"/> → captures "240"
 */
export const SPACING_BEFORE_REGEX = /<w:spacing[^>]*w:before="([^"]+)"/;

/**
 * Matches paragraph spacing after property.
 *
 * What it matches: <w:spacing w:after="240"/>
 * Captures: The spacing value in TWIPs (1/1440 inch)
 * Used by: extractParagraphProperties()
 *
 * Example: <w:spacing w:after="120"/> → captures "120"
 */
export const SPACING_AFTER_REGEX = /<w:spacing[^>]*w:after="([^"]+)"/;

// =============================================================================
// RUN-LEVEL PATTERNS (Text formatting)
// =============================================================================

/**
 * Matches run elements (formatting containers for text).
 *
 * What it matches: <w:r>...</w:r> containing run properties and text
 * Captures: The entire run content (everything between tags)
 * Used by: extractRunProperties()
 *
 * Example match:
 * <w:r>
 *   <w:rPr><w:b/><w:color w:val="FF0000"/></w:rPr>
 *   <w:t>Bold red text</w:t>
 * </w:r>
 */
export const RUN_REGEX = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;

/**
 * Matches text content elements.
 *
 * What it matches: <w:t>actual text</w:t> or <w:t xml:space="preserve">text</w:t>
 * Captures: The text content between tags
 * Used by: extractText(), extractRunProperties()
 *
 * Example: <w:t>Hello</w:t> → captures "Hello"
 */
export const TEXT_REGEX = /<w:t[^>]*>(.*?)<\/w:t>/g;

/**
 * Matches font family in run properties.
 *
 * What it matches: <w:rFonts w:ascii="Arial"/>
 * Captures: The font name
 * Used by: extractRunProperties()
 *
 * Note: Can also include w:hAnsi, w:cs, w:eastAsia for different character sets
 * Example: <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/> → captures "Calibri"
 */
export const FONT_REGEX = /<w:rFonts[^>]*w:ascii="([^"]+)"/;

/**
 * Matches text color in run properties.
 *
 * What it matches: <w:color w:val="FF0000"/>
 * Captures: The hex color value (RGB)
 * Used by: extractRunProperties()
 *
 * Example: <w:color w:val="0000FF"/> → captures "0000FF" (blue)
 */
export const COLOR_REGEX = /<w:color w:val="([^"]+)"/;

/**
 * Matches font size in run properties.
 *
 * What it matches: <w:sz w:val="24"/>
 * Captures: The font size in half-points
 * Used by: extractRunProperties()
 *
 * Note: Value is in half-points, so 24 = 12pt font
 * Example: <w:sz w:val="48"/> → captures "48" (24pt font)
 */
export const FONT_SIZE_REGEX = /<w:sz w:val="([^"]+)"/;
