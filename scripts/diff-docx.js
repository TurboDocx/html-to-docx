#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { diffLines } = require('diff');
const {
  extractDocx,
  normalizeXML,
  getAllFiles,
  shouldIgnoreFile,
  categorizeDifference,
  filesAreIdentical,
  isXMLFile,
} = require('./diff-utils');

/**
 * Main diff script for comparing two DOCX files
 * Usage: node scripts/diff-docx.js <baseline.docx> <current.docx> [--output <report.md>]
 */

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node scripts/diff-docx.js <baseline.docx> <current.docx> [--output <report.md>]');
    process.exit(1);
  }

  const baselinePath = args[0];
  const currentPath = args[1];
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

  if (!fs.existsSync(baselinePath)) {
    console.error(`Baseline file not found: ${baselinePath}`);
    process.exit(1);
  }

  if (!fs.existsSync(currentPath)) {
    console.error(`Current file not found: ${currentPath}`);
    process.exit(1);
  }

  console.log('📊 DOCX Diff Analysis\n');
  console.log(`Baseline: ${baselinePath}`);
  console.log(`Current:  ${currentPath}\n`);

  // Extract both DOCX files
  const tempDir = path.join(__dirname, '..', '.tmp-diff');
  const baselineDir = path.join(tempDir, 'baseline');
  const currentDir = path.join(tempDir, 'current');

  console.log('Extracting DOCX files...');
  await extractDocx(baselinePath, baselineDir);
  await extractDocx(currentPath, currentDir);
  console.log('✓ Extraction complete\n');

  // Get all files from both directories
  const baselineFiles = getAllFiles(baselineDir);
  const currentFiles = getAllFiles(currentDir);

  // Find new, deleted, and common files
  const allFiles = new Set([...baselineFiles, ...currentFiles]);
  const newFiles = [];
  const deletedFiles = [];
  const identicalFiles = [];
  const changedFiles = [];

  for (const file of allFiles) {
    if (shouldIgnoreFile(file)) {
      continue;
    }

    const baselineFile = path.join(baselineDir, file);
    const currentFile = path.join(currentDir, file);

    const inBaseline = fs.existsSync(baselineFile);
    const inCurrent = fs.existsSync(currentFile);

    if (!inBaseline && inCurrent) {
      newFiles.push(file);
    } else if (inBaseline && !inCurrent) {
      deletedFiles.push(file);
    } else if (inBaseline && inCurrent) {
      if (filesAreIdentical(baselineFile, currentFile)) {
        identicalFiles.push(file);
      } else {
        changedFiles.push(file);
      }
    }
  }

  // Analyze changes
  const report = {
    summary: {
      identical: identicalFiles.length,
      changed: changedFiles.length,
      new: newFiles.length,
      deleted: deletedFiles.length,
    },
    changes: [],
    warnings: [],
    errors: [],
  };

  // Process changed files
  for (const file of changedFiles) {
    const baselineFile = path.join(baselineDir, file);
    const currentFile = path.join(currentDir, file);

    let diff = null;
    let category = null;

    if (isXMLFile(file)) {
      // For XML files, normalize and diff
      const baselineContent = normalizeXML(fs.readFileSync(baselineFile, 'utf8'));
      const currentContent = normalizeXML(fs.readFileSync(currentFile, 'utf8'));

      if (baselineContent !== currentContent) {
        diff = diffLines(baselineContent, currentContent);
        const diffText = diff
          .filter((part) => part.added || part.removed)
          .map((part) => (part.added ? `+ ${part.value}` : `- ${part.value}`))
          .join('\n');

        category = categorizeDifference(file, diffText);
      }
    } else {
      // For binary files, just note they're different
      category = {
        type: 'binary_change',
        severity: 'info',
        needsReview: file.startsWith('word/media/'),
        description: 'Binary file changed',
      };
    }

    if (category) {
      const change = {
        file,
        category,
        diff,
      };

      report.changes.push(change);

      if (category.needsReview) {
        report.warnings.push(change);
      }
    }
  }

  // Process new files
  for (const file of newFiles) {
    const category = categorizeDifference(file, '');
    const change = {
      file,
      category: {
        ...category,
        type: 'new_file',
      },
    };

    report.changes.push(change);

    if (category.needsReview) {
      report.warnings.push(change);
    }
  }

  // Process deleted files
  for (const file of deletedFiles) {
    const change = {
      file,
      category: {
        type: 'deleted_file',
        severity: 'error',
        needsReview: true,
        description: 'File was deleted - this may indicate a regression',
      },
    };

    report.changes.push(change);
    report.errors.push(change);
  }

  // Generate report
  const reportText = generateReport(report);
  console.log(reportText);

  // Write to file if specified
  if (outputPath) {
    fs.writeFileSync(outputPath, reportText);
    console.log(`\n📄 Report saved to: ${outputPath}`);
  }

  // Cleanup temp directory
  fs.rmSync(tempDir, { recursive: true, force: true });

  // Exit with error code if there are errors
  if (report.errors.length > 0) {
    console.log('\n❌ Diff check failed: unexpected deletions detected');
    process.exit(1);
  }

  if (report.warnings.length > 0) {
    console.log('\n⚠️  Manual review recommended for detected changes');
  } else {
    console.log('\n✅ All changes look reasonable');
  }

  process.exit(0);
}

function generateReport(report) {
  const lines = [];

  lines.push('# TurboDocx DOCX Diff Report\n');
  lines.push('> **Automated HTML to DOCX regression testing** | Powered by [TurboDocx](https://turbodocx.com)\n');

  // Summary
  lines.push('## Summary\n');
  lines.push(`- ✅ Identical files: ${report.summary.identical}`);
  lines.push(`- 🔄 Changed files: ${report.summary.changed}`);
  lines.push(`- ➕ New files: ${report.summary.new}`);
  lines.push(`- ➖ Deleted files: ${report.summary.deleted}\n`);

  // Warnings
  if (report.warnings.length > 0) {
    lines.push('## ⚠️  Changes Requiring Manual Review\n');
    for (const change of report.warnings) {
      lines.push(`### ${change.file}`);
      lines.push(`- **Type**: ${change.category.type}`);
      lines.push(`- **Description**: ${change.category.description}`);
      lines.push('');
    }
  }

  // Errors
  if (report.errors.length > 0) {
    lines.push('## ❌ Errors\n');
    for (const change of report.errors) {
      lines.push(`### ${change.file}`);
      lines.push(`- **Type**: ${change.category.type}`);
      lines.push(`- **Description**: ${change.category.description}`);
      lines.push('');
    }
  }

  // All changes
  if (report.changes.length > 0) {
    lines.push('## 📝 Detailed Changes\n');
    for (const change of report.changes) {
      lines.push(`### ${change.file}`);
      lines.push(`- **Category**: ${change.category.type}`);
      lines.push(`- **Severity**: ${change.category.severity}`);
      if (change.category.description) {
        lines.push(`- **Description**: ${change.category.description}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
