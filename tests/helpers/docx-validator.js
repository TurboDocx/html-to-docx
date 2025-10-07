/**
 * DOCX Validation Helpers
 * Utilities for extracting and parsing DOCX file contents for testing
 */

import JSZip from 'jszip';
import { create } from 'xmlbuilder2';

/**
 * Unzip a DOCX file buffer and return the JSZip instance
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file as a buffer
 * @returns {Promise<JSZip>} JSZip instance with DOCX contents
 */
export async function unzipDocx(docxBuffer) {
  const zip = new JSZip();
  await zip.loadAsync(docxBuffer);
  return zip;
}

/**
 * Extract the main document XML from a DOCX zip
 * @param {JSZip} zip - JSZip instance containing DOCX files
 * @returns {Promise<string>} The word/document.xml file as a string
 */
export async function extractDocumentXML(zip) {
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) {
    throw new Error('word/document.xml not found in DOCX file');
  }
  return await documentFile.async('string');
}

/**
 * Parse XML string into a queryable XML document object
 * @param {string} xmlString - XML content as string
 * @returns {Object} Parsed XML document
 */
export function parseXML(xmlString) {
  return create(xmlString);
}

/**
 * Find all paragraph elements in the document XML
 * @param {string} xmlString - The document.xml content
 * @returns {Array} Array of paragraph elements
 */
export function findParagraphs(xmlString) {
  // Match all <w:p> elements (paragraphs)
  const paragraphRegex = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  const matches = xmlString.match(paragraphRegex);
  return matches || [];
}

/**
 * Extract text content from a paragraph element
 * @param {string} paragraphXml - Single paragraph XML string
 * @returns {string} Concatenated text content from all text runs
 */
export function extractText(paragraphXml) {
  // Match all <w:t> elements (text runs)
  const textRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
  const texts = [];
  let match;

  while ((match = textRegex.exec(paragraphXml)) !== null) {
    texts.push(match[1]);
  }

  return texts.join('');
}

/**
 * Extract paragraph properties (alignment, spacing, etc.)
 * @param {string} paragraphXml - Single paragraph XML string
 * @returns {Object} Object containing paragraph properties
 */
export function extractParagraphProperties(paragraphXml) {
  const properties = {};

  // Extract alignment (justification)
  const alignmentMatch = paragraphXml.match(/<w:jc w:val="([^"]+)"/);
  if (alignmentMatch) {
    properties.alignment = alignmentMatch[1];
  }

  // Extract spacing before
  const spacingBeforeMatch = paragraphXml.match(/<w:spacing[^>]*w:before="([^"]+)"/);
  if (spacingBeforeMatch) {
    properties.spacingBefore = parseInt(spacingBeforeMatch[1], 10);
  }

  // Extract spacing after
  const spacingAfterMatch = paragraphXml.match(/<w:spacing[^>]*w:after="([^"]+)"/);
  if (spacingAfterMatch) {
    properties.spacingAfter = parseInt(spacingAfterMatch[1], 10);
  }

  return properties;
}

/**
 * Extract run properties (font, color, bold, etc.) from a paragraph
 * @param {string} paragraphXml - Single paragraph XML string
 * @returns {Array} Array of run property objects
 */
export function extractRunProperties(paragraphXml) {
  const runs = [];

  // Match all <w:r> elements (text runs)
  const runRegex = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
  let match;

  while ((match = runRegex.exec(paragraphXml)) !== null) {
    const runXml = match[1];
    const runProps = {};

    // Extract font family
    const fontMatch = runXml.match(/<w:rFonts[^>]*w:ascii="([^"]+)"/);
    if (fontMatch) {
      runProps.font = fontMatch[1];
    }

    // Extract color
    const colorMatch = runXml.match(/<w:color w:val="([^"]+)"/);
    if (colorMatch) {
      runProps.color = colorMatch[1];
    }

    // Extract bold
    if (runXml.includes('<w:b />') || runXml.includes('<w:b/>')) {
      runProps.bold = true;
    }

    // Extract italic
    if (runXml.includes('<w:i />') || runXml.includes('<w:i/>')) {
      runProps.italic = true;
    }

    // Extract font size
    const sizeMatch = runXml.match(/<w:sz w:val="([^"]+)"/);
    if (sizeMatch) {
      runProps.fontSize = parseInt(sizeMatch[1], 10);
    }

    // Extract text content
    const textMatch = runXml.match(/<w:t[^>]*>(.*?)<\/w:t>/);
    if (textMatch) {
      runProps.text = textMatch[1];
    }

    runs.push(runProps);
  }

  return runs;
}

/**
 * Complete validation helper - extracts and parses DOCX in one call
 * @param {Buffer|Uint8Array} docxBuffer - The DOCX file
 * @returns {Promise<Object>} Object with parsed content: { paragraphs, xml, zip }
 */
export async function parseDOCX(docxBuffer) {
  const zip = await unzipDocx(docxBuffer);
  const documentXml = await extractDocumentXML(zip);
  const paragraphs = findParagraphs(documentXml);

  // Parse each paragraph
  const parsedParagraphs = paragraphs.map((paraXml) => ({
    xml: paraXml,
    text: extractText(paraXml),
    properties: extractParagraphProperties(paraXml),
    runs: extractRunProperties(paraXml),
  }));

  return {
    paragraphs: parsedParagraphs,
    xml: documentXml,
    zip,
  };
}
