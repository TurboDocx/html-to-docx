const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

/**
 * Extracts a DOCX file (which is just a ZIP archive) to a directory
 * @param {string} docxPath - Path to the DOCX file
 * @param {string} extractDir - Directory to extract to
 * @returns {Promise<void>}
 */
async function extractDocx(docxPath, extractDir) {
  const data = fs.readFileSync(docxPath);
  const zip = await JSZip.loadAsync(data);

  // Create extraction directory if it doesn't exist
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  // Extract all files
  const promises = [];
  zip.forEach((relativePath, file) => {
    const filePath = path.join(extractDir, relativePath);

    if (file.dir) {
      // Create directory
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }
    } else {
      // Extract file
      promises.push(
        file.async('nodebuffer').then((content) => {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, content);
        })
      );
    }
  });

  await Promise.all(promises);
}

/**
 * Normalizes XML content by removing insignificant whitespace
 * @param {string} xmlContent - XML content to normalize
 * @returns {string} Normalized XML
 */
function normalizeXML(xmlContent) {
  return xmlContent
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();
}

/**
 * Prettifies XML content for better readability in diffs
 * @param {string} xmlContent - XML content to prettify
 * @returns {string} Prettified XML with proper indentation
 */
function prettifyXML(xmlContent) {
  let formatted = '';
  let indent = 0;
  const tab = '  '; // 2 spaces

  // Split by tags
  const parts = xmlContent.split(/(<[^>]+>)/g).filter((part) => part.trim());

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Check if it's a tag
    if (part.startsWith('<')) {
      // Closing tag
      if (part.startsWith('</')) {
        indent = Math.max(0, indent - 1);
        formatted += tab.repeat(indent) + part + '\n';
      }
      // Self-closing tag or opening tag
      else if (part.endsWith('/>') || part.startsWith('<?')) {
        formatted += tab.repeat(indent) + part + '\n';
      }
      // Opening tag
      else {
        formatted += tab.repeat(indent) + part + '\n';
        indent++;
      }
    }
    // Text content
    else {
      // Only add non-empty text
      if (part.trim()) {
        formatted += tab.repeat(indent) + part + '\n';
      }
    }
  }

  return formatted.trim();
}

/**
 * Gets all files in a directory recursively
 * @param {string} dir - Directory to scan
 * @param {string} basePath - Base path for relative paths
 * @returns {string[]} Array of relative file paths
 */
function getAllFiles(dir, basePath = dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, basePath));
    } else {
      files.push(path.relative(basePath, fullPath));
    }
  }

  return files;
}

/**
 * Determines if a file should be ignored in the diff
 * @param {string} filePath - Relative file path
 * @returns {boolean} True if file should be ignored
 */
function shouldIgnoreFile(filePath) {
  const ignoredPaths = [
    'docProps/core.xml', // Contains timestamps that will always differ
    '_rels/.rels', // Usually static
  ];

  return ignoredPaths.some((ignored) => filePath === ignored);
}

/**
 * Categorizes a file difference
 * @param {string} filePath - Relative file path
 * @param {string} diff - Diff content
 * @returns {Object} Category and metadata
 */
function categorizeDifference(filePath, diff) {
  const category = {
    type: 'change',
    severity: 'info',
    needsReview: false,
    description: '',
  };

  // Check for new images
  if (filePath.startsWith('word/media/')) {
    category.type = 'new_media';
    category.severity = 'warn';
    category.needsReview = true;
    category.description = 'New image added - verify this is expected from new test case';
    return category;
  }

  // Check for document content changes
  if (filePath === 'word/document.xml') {
    // Check if new paragraphs were added
    if (diff.includes('<w:p') || diff.includes('</w:p>')) {
      category.type = 'content_change';
      category.severity = 'warn';
      category.needsReview = true;
      category.description = 'New paragraphs or content added - verify test case changes';
      return category;
    }

    // Check for dimension/style changes
    if (diff.includes('cx="') || diff.includes('cy="') || diff.includes('<w:sz')) {
      category.type = 'style_change';
      category.severity = 'info';
      category.needsReview = false;
      category.description = 'Dimension or style changes detected';
      return category;
    }
  }

  // Check for relationship changes
  if (filePath.endsWith('.rels')) {
    category.type = 'relationship_change';
    category.severity = 'info';
    category.needsReview = false;
    category.description = 'Relationship changes (expected with new images/content)';
    return category;
  }

  return category;
}

/**
 * Checks if two files are binary identical
 * @param {string} file1 - Path to first file
 * @param {string} file2 - Path to second file
 * @returns {boolean} True if files are identical
 */
function filesAreIdentical(file1, file2) {
  if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
    return false;
  }

  const content1 = fs.readFileSync(file1);
  const content2 = fs.readFileSync(file2);

  return content1.equals(content2);
}

/**
 * Checks if a file is XML
 * @param {string} filePath - File path
 * @returns {boolean} True if file is XML
 */
function isXMLFile(filePath) {
  return filePath.endsWith('.xml') || filePath.endsWith('.rels');
}

module.exports = {
  extractDocx,
  normalizeXML,
  prettifyXML,
  getAllFiles,
  shouldIgnoreFile,
  categorizeDifference,
  filesAreIdentical,
  isXMLFile,
};
