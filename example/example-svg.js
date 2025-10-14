/* eslint-disable no-console */
const fs = require('fs');
// Use the built version, or install via: npm install @turbodocx/html-to-docx
// const HTMLtoDOCX = require('@turbodocx/html-to-docx');
const HTMLtoDOCX = require('../dist/html-to-docx.umd');

// Sample SVG images as base64 data URLs
const circleSVG = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiLz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzM0OThkYiIgc3Ryb2tlPSIjMmMzZTUwIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';

const chartSVG = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjAwIDE1MCI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNmZmZmZmYiLz4KICA8cmVjdCB4PSIyMCIgeT0iMTAwIiB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIGZpbGw9IiMyZWNjNzEiLz4KICA8cmVjdCB4PSI2MCIgeT0iNzAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI3MCIgZmlsbD0iIzNjOThlNyIvPgogIDxyZWN0IHg9IjEwMCIgeT0iNTAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI5MCIgZmlsbD0iI2U3NGMzYyIvPgogIDxyZWN0IHg9IjE0MCIgeT0iMzAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIxMTAiIGZpbGw9IiNmMzljMTIiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjE1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5TYWxlcyBDaGFydDwvdGV4dD4KPC9zdmc+';

const iconSVG = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj4KICA8cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiMyN2FlNjAiIHJ4PSI1Ii8+CiAgPHBhdGggZD0iTSAxNSAyNSBMIDIyIDMyIEwgMzUgMTgiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>SVG Support Demo</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2c3e50; }
        h2 { color: #3498db; margin-top: 30px; }
        p { line-height: 1.6; color: #555; }
        .info-box {
            background-color: #e8f4f8;
            padding: 15px;
            border-left: 4px solid #3498db;
            margin: 20px 0;
        }
        .comparison {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .comparison-item {
            flex: 1;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>SVG Image Support Demonstration</h1>

    <div class="info-box">
        <p><strong>About this document:</strong> This example demonstrates the SVG image handling capabilities of @turbodocx/html-to-docx. SVG images can be embedded using two different strategies:</p>
        <ul>
            <li><strong>Convert to PNG (Default):</strong> Maximum compatibility with all Word versions</li>
            <li><strong>Native SVG:</strong> Perfect vector quality for Office 2019+</li>
        </ul>
    </div>

    <h2>1. Basic SVG Shape</h2>
    <p>A simple circle demonstrating basic SVG rendering:</p>
    <img src="data:image/svg+xml;base64,${circleSVG}" alt="Blue circle" width="100" height="100" />

    <h2>2. SVG Chart/Graph</h2>
    <p>A bar chart showing how SVGs can be used for data visualization:</p>
    <img src="data:image/svg+xml;base64,${chartSVG}" alt="Sales chart" width="200" height="150" />

    <h2>3. SVG Icon</h2>
    <p>A checkmark icon demonstrating inline SVG usage:</p>
    <p>
        Task completed successfully!
        <img src="data:image/svg+xml;base64,${iconSVG}" alt="Checkmark" width="24" height="24" style="vertical-align: middle;" />
    </p>

    <h2>4. Multiple SVGs in a Row</h2>
    <p>Multiple SVG images can be used together:</p>
    <p>
        <img src="data:image/svg+xml;base64,${iconSVG}" alt="Icon 1" width="30" height="30" />
        <img src="data:image/svg+xml;base64,${iconSVG}" alt="Icon 2" width="30" height="30" />
        <img src="data:image/svg+xml;base64,${iconSVG}" alt="Icon 3" width="30" height="30" />
    </p>

    <h2>5. SVG with Different Sizes</h2>
    <p>The same SVG can be rendered at different sizes without quality loss (in native mode):</p>
    <img src="data:image/svg+xml;base64,${circleSVG}" alt="Small circle" width="50" height="50" />
    <img src="data:image/svg+xml;base64,${circleSVG}" alt="Medium circle" width="100" height="100" />
    <img src="data:image/svg+xml;base64,${circleSVG}" alt="Large circle" width="150" height="150" />

    <h2>6. SVG in Table</h2>
    <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
        <tr>
            <th>Status</th>
            <th>Icon</th>
            <th>Description</th>
        </tr>
        <tr>
            <td>Success</td>
            <td><img src="data:image/svg+xml;base64,${iconSVG}" alt="Success" width="30" height="30" /></td>
            <td>Operation completed successfully</td>
        </tr>
        <tr>
            <td>Progress</td>
            <td><img src="data:image/svg+xml;base64,${circleSVG}" alt="In progress" width="30" height="30" /></td>
            <td>Operation in progress</td>
        </tr>
    </table>

    <h2>Technical Details</h2>
    <div class="info-box">
        <p><strong>Conversion Mode (Default):</strong></p>
        <ul>
            <li>SVG images are automatically converted to PNG format</li>
            <li>Works with Microsoft Word 2007, 2010, 2013, 2016, 2019, 365</li>
            <li>Compatible with Word Online, Google Docs, and LibreOffice</li>
            <li>No "unreadable content" warnings</li>
        </ul>

        <p><strong>Native SVG Mode (Office 2019+):</strong></p>
        <ul>
            <li>SVG embedded using Office Open XML SVGBlip extension</li>
            <li>Perfect vector quality at any zoom level</li>
            <li>Smaller file sizes for complex graphics</li>
            <li>Requires Office 2019 or Microsoft 365</li>
        </ul>
    </div>

    <p style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; color: #888;">
        <em>Generated using @turbodocx/html-to-docx - SVG Support Example</em>
    </p>
</body>
</html>`;

async function generateDocuments() {
  console.log('🚀 Generating SVG example documents...\n');

  try {
    // 1. Generate document with PNG conversion (default)
    console.log('📄 Generating document with SVG→PNG conversion (default)...');
    const docxConvert = await HTMLtoDOCX(htmlContent, null, {
      orientation: 'portrait',
      title: 'SVG Support Demo - PNG Conversion',
      creator: '@turbodocx/html-to-docx',
      imageProcessing: {
        svgHandling: 'convert', // Convert SVG to PNG
        verboseLogging: false,
      },
    });
    fs.writeFileSync('./example-svg-convert.docx', docxConvert);
    console.log('✅ Created: example-svg-convert.docx');
    console.log('   → SVGs converted to PNG for maximum compatibility\n');

    // 2. Generate document with native SVG support
    console.log('📄 Generating document with native SVG support (Office 2019+)...');
    const docxNative = await HTMLtoDOCX(htmlContent, null, {
      orientation: 'portrait',
      title: 'SVG Support Demo - Native SVG',
      creator: '@turbodocx/html-to-docx',
      imageProcessing: {
        svgHandling: 'native', // Embed SVG natively
        verboseLogging: false,
      },
    });
    fs.writeFileSync('./example-svg-native.docx', docxNative);
    console.log('✅ Created: example-svg-native.docx');
    console.log('   → SVGs embedded natively (requires Office 2019+)\n');

    // Display comparison
    console.log('📊 Comparison:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('│ Feature                 │ Convert Mode │ Native Mode     │');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('│ Word 2007-2016          │ ✅ Yes       │ ❌ No          │');
    console.log('│ Word 2019+/365          │ ✅ Yes       │ ✅ Yes         │');
    console.log('│ Word Online             │ ✅ Yes       │ ⚠️  Limited    │');
    console.log('│ LibreOffice             │ ✅ Yes       │ ❌ No          │');
    console.log('│ Vector Quality          │ ⚠️  Raster   │ ✅ Perfect     │');
    console.log('│ File Size (complex SVG) │ ⚠️  Larger   │ ✅ Smaller     │');
    console.log('─────────────────────────────────────────────────────────────');

    console.log('\n📖 Usage:');
    console.log('   • Open example-svg-convert.docx in any Word version');
    console.log('   • Open example-svg-native.docx in Word 2019+ or Microsoft 365');
    console.log('   • Compare the quality when zooming in (native SVG scales perfectly)');

    console.log('\n💡 Tip: Use "convert" mode for production documents that need');
    console.log('   broad compatibility. Use "native" mode for modern Office');
    console.log('   environments where vector quality matters.\n');

    console.log('✨ Done! Check the example/ directory for the generated files.');
  } catch (error) {
    console.error('❌ Error generating documents:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the example
generateDocuments();
